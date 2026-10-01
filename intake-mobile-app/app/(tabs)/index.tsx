import { useState, useRef, useCallback, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, AppState, ActivityIndicator } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import styles from '@/styles/intakeStyles';
import IntakeCameraModal from '@/components/intake/IntakeCameraModal';
import IntakeImagesSection from '@/components/intake/IntakeImagesSection';
import IntakeItemCard from '@/components/intake/IntakeItemCard';
import PreflightReviewModal from '@/components/intake/PreflightReviewModal';
import CategoryPickerModal from '@/components/intake/CategoryPickerModal';
import {
  getBrandCatalogList,
  resolveCatalogMatch,
  enrichIntakeItem,
  calculateUpdatedItem
} from '@/utils/posTaxonomy';
import {
  uploadImageAsync,
  fetchPackageCost as apiFetchPackageCost,
  fetchBrandItems,
  fetchCategoriesAndBrands,
  analyzeSessionImages,
  previewIntakeApi,
  submitIntakeApi,
  fetchJobStatus
} from '@/services/intakeService';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<'intake' | 'barcode' | null>(null);
  const cameraRef = useRef<any>(null);

  const [intakeImages, setIntakeImages] = useState<any[]>([]);
  const generateSessionId = () => 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();

  const [sessionId, setSessionId] = useState('');
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const processQueueRef = useRef<() => void>(() => {});

  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [jobState, setJobState] = useState<any>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [manifestData, setManifestData] = useState<any>({ manifest_number: null, vendor: null });
  const [barcodeTargetIndex, setBarcodeTargetIndex] = useState<number | null>(null);
  const [metrcWarning, setMetrcWarning] = useState<string | null>(null);

  // Keep screen awake while uploading photos, processing manifest, or submitting
  useEffect(() => {
    const isUploading = intakeImages.some(img => img.status === 'pending' || img.status === 'uploading');
    if (isUploading || loading || isSubmitting || isPreviewing) {
      activateKeepAwakeAsync('intake-screen-awake').catch(() => {});
    } else {
      deactivateKeepAwake('intake-screen-awake').catch(() => {});
    }
    return () => {
      deactivateKeepAwake('intake-screen-awake').catch(() => {});
    };
  }, [intakeImages, loading, isSubmitting, isPreviewing]);

  const [brandItems, setBrandItems] = useState<Record<string, any[]>>({});
  const [activeSlugIndex, setActiveSlugIndex] = useState<number | null>(null);
  const [liveBrands, setLiveBrands] = useState<string[]>([]);
  const [liveCategories, setLiveCategories] = useState<string[]>([]);
  const [liveStrains, setLiveStrains] = useState<any[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [printSettings, setPrintSettings] = useState<Record<string, any>>({});

  // Tier 3 and Subagent Browser Test Window Hooks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).brandItems = brandItems;
      (window as any).results = results;
      (window as any).sessionId = sessionId;
      (window as any).intakeImages = intakeImages;
      (window as any).testSetResults = (items: any[], manifest: any = { manifest_number: 'TEST-MANIFEST', vendor: 'Test Vendor' }, customBrandItems: any = null) => {
        const curBrands = liveBrands;
        const curStrains = liveStrains;
        const curBrandItems = customBrandItems || brandItems;

        const enriched = (items || []).map((item: any) => enrichIntakeItem(item, { curBrands, curStrains, curBrandItems }));
        setResults(enriched);
        setManifestData(manifest);
        (window as any).results = enriched;
        if (customBrandItems) {
          setBrandItems(customBrandItems);
          (window as any).brandItems = customBrandItems;
        }
      };
      (window as any).testPreviewIntake = previewIntake;
      (window as any).testSetPreviewData = (preview: any[]) => {
        setPreviewData(preview);
      };
      (window as any).testLoadShipmentSession = (sessId: string, imageFiles: any[] = []) => {
        setSessionId(sessId);
        (window as any).sessionId = sessId;
        if (imageFiles && imageFiles.length > 0) {
          const formatted = imageFiles.map((img: any, idx: number) => ({
            localUri: typeof img === 'string' ? img : (img.uri || img.localUri || ''),
            status: 'completed',
            imageIndex: idx
          }));
          setIntakeImages(formatted);
          (window as any).intakeImages = formatted;
        }
      };
      (window as any).testProcessIntake = () => {
        return analyzeImages();
      };
    }
  }, [results, manifestData, intakeImages, sessionId, liveCategories, liveBrands, brandItems]);

  const retryFailedImages = useCallback(() => {
    setIntakeImages(current => 
      current.map(img => img.status === 'failed' ? { ...img, status: 'pending', error: undefined } : img)
    );
  }, []);

  const uploadSingleImageInBackground = useCallback(async (localUri: string, index: number) => {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      try {
        const data = await uploadImageAsync(localUri, index, sessionId, liveCategories, liveBrands);
        if (data.error) throw new Error(data.error);

        setIntakeImages(current => 
          current.map(img => img.localUri === localUri ? { ...img, status: 'completed' } : img)
        );
        activeUploadsRef.current.delete(localUri);
        processQueueRef.current();
        return;
      } catch (err: any) {
        attempt++;
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1200));
        }
      }
    }

    setIntakeImages(current => 
      current.map(img => img.localUri === localUri ? { ...img, status: 'failed', error: lastError.message || String(lastError) } : img)
    );
    activeUploadsRef.current.delete(localUri);
    processQueueRef.current();
  }, [sessionId, liveCategories, liveBrands]);

  const isProcessingQueueRef = useRef(false);

  const processQueue = useCallback(() => {
    if (isProcessingQueueRef.current) return;
    const currentImages = intakeImages;
    const pendingImages = currentImages.filter(img => img.status === 'pending');
    const uploadingImages = currentImages.filter(img => img.status === 'uploading');
    const slotsAvailable = 3 - uploadingImages.length;

    if (slotsAvailable <= 0 || pendingImages.length === 0) return;

    isProcessingQueueRef.current = true;
    const imagesToUpload = pendingImages.slice(0, slotsAvailable);
    const toUploadUris = new Set(imagesToUpload.map(i => i.localUri));

    setIntakeImages(prev => prev.map(img => toUploadUris.has(img.localUri) ? { ...img, status: 'uploading' } : img));
    imagesToUpload.forEach(img => uploadSingleImageInBackground(img.localUri, img.imageIndex));
    isProcessingQueueRef.current = false;
  }, [intakeImages, uploadSingleImageInBackground]);

  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  useEffect(() => {
    processQueue();
  }, [intakeImages, processQueue]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        setIntakeImages(current => {
          if (current.some(img => img.status === 'uploading')) {
            activeUploadsRef.current.clear();
            return current.map(img => img.status === 'uploading' ? { ...img, status: 'pending' } : img);
          }
          return current;
        });
        setTimeout(() => {
          if (processQueueRef.current) processQueueRef.current();
        }, 300);
      }
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchCategories = async (attempt = 1) => {
        try {
          const data = await fetchCategoriesAndBrands();
          if (!isMounted) return;
          if (data.brands && Array.isArray(data.brands)) setLiveBrands(data.brands);
          if (data.strains && Array.isArray(data.strains)) setLiveStrains(data.strains);
          if (data.categories && Array.isArray(data.categories)) {
            const paths = data.categories.map((c: any) => typeof c === 'string' ? c : c.category_path).filter(Boolean).sort();
            setLiveCategories([...new Set(paths)] as string[]);
          }
        } catch (e) {
          if (attempt < 3) {
            setTimeout(() => { if (isMounted) fetchCategories(attempt + 1); }, 1500);
          }
        }
      };
      fetchCategories();
      return () => { isMounted = false; };
    }, [])
  );

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (captureTarget === 'intake') {
          setIntakeImages(prev => [...prev, { localUri: photo.uri, status: 'pending', imageIndex: prev.length }]);
        } else {
          setCameraActive(false);
          setIsTorchOn(false);
        }
      } catch (err: any) {
        console.error("Error capturing photo:", err);
      }
    }
  };

  const fetchPackageCost = async (index: number, uid: string) => {
    if (!uid || uid.length < 24) {
      alert("Invalid UID passed to fetchPackageCost: " + uid);
      return;
    }
    try {
      const data = await apiFetchPackageCost(uid);
      if (data.found && data.cost_of_good !== undefined && data.cost_of_good !== null) {
        updateItem(index, 'costOfGoods', data.cost_of_good.toString());
        alert('Successfully pulled wholesale cost: $' + data.cost_of_good);
      } else {
        alert('Wholesale cost not found for this package in Alleaves. You may need to enter it manually.');
      }
    } catch (e: any) {
      alert('Error fetching cost: ' + (e.message || String(e)));
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (captureTarget === 'barcode' && barcodeTargetIndex !== null) {
      const match = data.trim().match(/[A-Za-z0-9]{24}/);
      if (match) {
        const uid = match[0].toUpperCase();
        updateItem(barcodeTargetIndex, 'uid', uid);
        fetchPackageCost(barcodeTargetIndex, uid);
      } else {
        alert(`Could not find a valid 24-character Metrc UID in scanned data:\n\n${data}`);
      }
      setCameraActive(false);
      setIsTorchOn(false);
      setBarcodeTargetIndex(null);
      setCaptureTarget(null);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 0,
        quality: 0.8,
        base64: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const currentCount = intakeImages.length;
        const newImages = result.assets.map((asset, idx) => ({ 
          localUri: asset.uri, 
          status: 'pending',
          imageIndex: currentCount + idx
        }));
        setIntakeImages(prev => [...prev, ...newImages]);
      }
    } catch (err: any) {
      alert("Error picking images: " + (err.message || String(err)));
    }
  };

  const analyzeImages = async () => {
    setLoading(true);
    const activeCount = intakeImages.filter(img => img.status === 'pending' || img.status === 'uploading').length;
    if (activeCount > 0) {
      alert(`Please wait for background uploads to finish (${activeCount} remaining).`);
      setLoading(false);
      return;
    }

    try {
      const data = await analyzeSessionImages(sessionId);
      if (data.error) {
        alert(`API Error: ${data.error}`);
        return;
      }
      if (data.items && Array.isArray(data.items)) {
        const curBrands = (data.brands && data.brands.length > 0) ? data.brands : liveBrands;
        const curStrains = (data.strains && data.strains.length > 0) ? data.strains : liveStrains;
        const curBrandItems = data.brandItems || brandItems;

        const sortedItems = data.items
          .map((item: any) => enrichIntakeItem(item, { curBrands, curStrains, curBrandItems }))
          .sort((a: any, b: any) => (a.line_number ?? 999) - (b.line_number ?? 999));

        setResults(sortedItems);
        setManifestData({
          manifest_number: data.manifest_number,
          vendor: data.vendor,
          originating_entity_license: data.originating_entity_license,
          originating_entity_address: data.originating_entity_address,
          originating_entity_phone: data.originating_entity_phone
        });
        setMetrcWarning(data.metrc_pending_warning ? (data.metrc_warning_message || 'Packages not found in Alleaves queue.') : null);
        if (data.brandItems) {
          setBrandItems(data.brandItems);
          if (typeof window !== 'undefined') (window as any).brandItems = data.brandItems;
        }
        if (typeof window !== 'undefined') (window as any).results = sortedItems;
        if (data.brands?.length) setLiveBrands(data.brands);
        if (data.strains?.length) setLiveStrains(data.strains);
        if (data.categories?.length) {
          const paths = data.categories.map((c: any) => typeof c === 'string' ? c : c.category_path).filter(Boolean).sort();
          setLiveCategories([...new Set(paths)] as string[]);
        }
      } else if (Array.isArray(data)) {
        setResults(data);
        setManifestData({ manifest_number: 'UNKNOWN', vendor: 'UNKNOWN' });
      } else {
        alert("Error parsing manifest format: AI returned invalid schema.");
      }
    } catch (e: any) {
      alert(`Error connecting to Backend AI: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (field === 'brand' && value && getBrandCatalogList(brandItems, value).length === 0) {
      fetchBrandItems(value)
        .then(data => {
          if (data.success && data.brandItems) {
            setBrandItems(prev => ({ ...prev, [value]: data.brandItems }));
            setResults((prevResults: any[] | null) => {
              if (!prevResults) return null;
              return prevResults.map((r) => {
                if (r.brand === value) {
                  const matchRes = resolveCatalogMatch(data.brandItems, r.proposedSlug || '', r);
                  if (matchRes.matchedBase || matchRes.matchedSample) {
                    return { 
                      ...r, 
                      target_item_exists: true, 
                      target_item_name: matchRes.target_item_name, 
                      target_sample_name: matchRes.target_sample_name,
                      proposedSlug: r.isSample ? matchRes.target_sample_name : matchRes.target_item_name
                    };
                  }
                }
                return r;
              });
            });
          }
        })
        .catch(e => console.error("Failed to fetch brand items", e));
    }

    setResults((prev: any[] | null) => {
      if (!prev) return null;
      const newResults = [...prev];
      newResults[index] = calculateUpdatedItem(newResults[index], field, value, {
        curBrands: liveBrands,
        curStrains: liveStrains,
        curBrandItems: brandItems,
        siblingItems: prev || []
      });
      return newResults;
    });
  };

  const handleApplyBrandAll = (brand: string) => {
    setResults((prevResults: any[] | null) => {
      if (!prevResults) return null;
      return prevResults.map(r => calculateUpdatedItem({ ...r, brand }, 'brand', brand, {
        curBrands: liveBrands,
        curStrains: liveStrains,
        curBrandItems: brandItems,
        siblingItems: prevResults || []
      }));
    });
  };

  const handleApplyBrandNext = (brand: string, index: number) => {
    setResults((prevResults: any[] | null) => {
      if (!prevResults) return null;
      return prevResults.map((r, rIndex) => {
        if (rIndex === index || rIndex === index + 1) {
          return calculateUpdatedItem({ ...r, brand }, 'brand', brand, {
            curBrands: liveBrands,
            curStrains: liveStrains,
            curBrandItems: brandItems,
            siblingItems: prevResults || []
          });
        }
        return r;
      });
    });
  };

  const previewIntake = async () => {
    setIsPreviewing(true);
    try {
      const data = await previewIntakeApi(results || [], manifestData);
      if (!data.error && data.preview) {
        setPreviewData(data.preview);
        const initialPrintSettings: Record<string, any> = {};
        data.preview.forEach((item: any) => {
          const qty = item.metrc_quantity || 1;
          initialPrintSettings[item.uid] = { enabled: true, quantity: item.isSample ? qty : Math.ceil(qty / 10) };
        });
        setPrintSettings(initialPrintSettings);
      } else {
        alert(`Preview Error: ${data.error || 'Failed to generate preview'}`);
        setIsPreviewing(false);
      }
    } catch (e: any) {
      alert(`Error connecting to MCP Backend: ${e.message || String(e)}`);
      setIsPreviewing(false);
    }
  };

  const submitIntake = async () => {
    setIsSubmitting(true);
    setJobState({ status: 'STARTING', progress: 'Submitting intake to backend...' });

    let isCompleted = false;
    let isTerminated = false;
    const manifestNum = manifestData?.manifest_number || 'UNKNOWN';

    const pollInterval = setInterval(async () => {
      if (isCompleted || isTerminated || !manifestNum || manifestNum === 'UNKNOWN') return;
      try {
        const data = await fetchJobStatus(manifestNum);
        if (data?.status) {
          setJobState(data);
          if (data.status === 'COMPLETED') {
            isCompleted = true;
            clearInterval(pollInterval);
            setJobState({ status: 'COMPLETED', progress: 'All 5 steps verified complete!' });
            setTimeout(() => {
              alert(`Successfully imported ${results?.length || ''} items to Alleaves!\n\n✓ All packages active in POS\n✓ Vendor synced\n✓ Barcode labels dispatched to printer`);
              setIsPreviewing(false);
              setPreviewData(null);
              setJobState(null);
              setResults(null);
              setIntakeImages([]);
              setSessionId(generateSessionId());
              setIsSubmitting(false);
            }, 1500);
          } else if (data.status === 'ERROR' || data.status === 'FAILED') {
            isTerminated = true;
            clearInterval(pollInterval);
            alert(`Import Error: ${data.error_log || data.error || 'Submission failed'}`);
            setJobState(null);
            setIsSubmitting(false);
          }
        }
      } catch {}
    }, 1000);

    try {
      const resData = await submitIntakeApi(results || [], manifestData, printSettings, sessionId, false);
      if (resData && !resData.error && !isCompleted) {
        isCompleted = true;
        clearInterval(pollInterval);
        setJobState({ status: 'COMPLETED', progress: 'All 5 steps verified complete!' });
        setTimeout(() => {
          alert(`Successfully imported ${results?.length || ''} items to Alleaves!\n\n✓ All packages active in POS\n✓ Vendor synced\n✓ Barcode labels dispatched to printer`);
          setIsPreviewing(false);
          setPreviewData(null);
          setJobState(null);
          setResults(null);
          setIntakeImages([]);
          setSessionId(generateSessionId());
          setIsSubmitting(false);
        }, 1500);
      } else if (resData?.error && !resData.error.includes('524')) {
        isTerminated = true;
        clearInterval(pollInterval);
        alert(`Import Error: ${resData.error}`);
        setIsSubmitting(false);
      }
    } catch (e: any) {
      console.log("[Submit HTTP Notice]: Connection closed by proxy, continuing background polling:", e.message);
    } finally {
      if (isCompleted || isTerminated) {
        clearInterval(pollInterval);
        setIsSubmitting(false);
      }
    }
  };

  const generatePayload = async () => {
    try {
      const data = await submitIntakeApi(results || [], manifestData, printSettings, sessionId, true);
      if (data?.dryRun || data?.success) {
        const payloadItems = data.report?.importBatchPayload || data.payload || [];
        console.log("==========================================");
        console.log("📦 DRY RUN PAYLOAD GENERATED:");
        console.log(JSON.stringify(data.report || data.payload, null, 2));
        console.log("==========================================");
        alert(`Payload Generated Successfully!\n(${payloadItems.length || (results?.length ?? 0)} items validated in Dry Run). Check terminal for full JSON.`);
      } else {
        alert(`Error: ${data?.error || data?.message || 'Unknown error occurred while generating payload'}`);
      }
    } catch (e: any) {
      alert(`Error connecting to Backend: ${e.message || 'Network timeout'}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <IntakeCameraModal
        visible={cameraActive}
        captureTarget={captureTarget}
        isTorchOn={isTorchOn}
        cameraRef={cameraRef}
        intakeImagesCount={intakeImages.length}
        onToggleTorch={() => setIsTorchOn(prev => !prev)}
        onCapturePhoto={takePicture}
        onBarcodeScanned={captureTarget === 'barcode' ? handleBarcodeScanned : undefined}
        onClose={() => { setCameraActive(false); setIsTorchOn(false); }}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.bg} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Manifest Intake</Text>

        {!results ? (
          <IntakeImagesSection
            images={intakeImages}
            loading={loading}
            onRetryFailed={retryFailedImages}
            onClearAll={() => setIntakeImages([])}
            onRetrySingleImage={(localUri) => {
              setIntakeImages(curr => curr.map(img => img.localUri === localUri ? { ...img, status: 'pending', error: undefined } : img));
            }}
            onRemoveImage={(idx) => {
              setIntakeImages(intakeImages.filter((_, i) => i !== idx));
            }}
            onOpenCamera={() => { setCaptureTarget('intake'); setCameraActive(true); }}
            onOpenGallery={pickImage}
            onProcessIntake={analyzeImages}
          />
        ) : (
          <View style={{ width: '100%' }}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => { setResults(null); setMetrcWarning(null); }} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Review {results.length} Line Items</Text>
              <View style={{ width: 50 }} />
            </View>

            {metrcWarning && (
              <View style={{ backgroundColor: '#2B1700', borderWidth: 1.5, borderColor: '#FF9500', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="warning" size={18} color="#FF9500" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 13 }}>Metrc / Alleaves Sync Pending</Text>
                </View>
                <Text style={{ color: '#FBE8D3', fontSize: 12, lineHeight: 16 }}>
                  {metrcWarning}
                </Text>
              </View>
            )}

            {results.map((item, index) => (
              <IntakeItemCard
                key={index}
                item={item}
                index={index}
                brandItems={brandItems}
                liveBrands={liveBrands}
                liveStrains={liveStrains}
                activeSlugIndex={activeSlugIndex}
                onUpdateItem={updateItem}
                onDeleteItem={(delIdx) => setResults(results.filter((_, i) => i !== delIdx))}
                onApplyBrandAll={handleApplyBrandAll}
                onApplyBrandNext={handleApplyBrandNext}
                onFetchPackageCost={fetchPackageCost}
                onScanBarcode={(scanIdx) => {
                  setCaptureTarget('barcode');
                  setBarcodeTargetIndex(scanIdx);
                  setCameraActive(true);
                }}
                onOpenCategoryModal={(catIdx) => {
                  setActiveCategoryIndex(catIdx);
                  setCategoryModalVisible(true);
                }}
                onSetActiveSlugIndex={setActiveSlugIndex}
              />
            ))}

            <TouchableOpacity style={styles.approveBtn} onPress={previewIntake} disabled={isPreviewing}>
              {isPreviewing ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeBtnText}>Approve Transfer ✅</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => { setResults(null); setIntakeImages([]); setSessionId(generateSessionId()); }} disabled={isPreviewing}>
              <Text style={styles.buttonText}>Restart</Text>
            </TouchableOpacity>
          </View>
        )}

        <PreflightReviewModal
          visible={previewData !== null}
          previewData={previewData}
          isSubmitting={isSubmitting}
          jobState={jobState}
          printSettings={printSettings}
          onUpdatePrintSetting={(uid, setting) => {
            setPrintSettings((prev: any) => ({ ...prev, [uid]: { ...prev[uid], ...setting } }));
          }}
          onClose={() => { setPreviewData(null); setIsPreviewing(false); }}
          onGenerateDryRun={generatePayload}
          onSubmit={submitIntake}
        />

        <CategoryPickerModal
          visible={categoryModalVisible}
          options={liveCategories}
          value={activeCategoryIndex !== null && results && results[activeCategoryIndex] ? results[activeCategoryIndex].category : ''}
          onClose={() => setCategoryModalVisible(false)}
          onSelect={(val) => {
            if (activeCategoryIndex !== null) {
              updateItem(activeCategoryIndex, 'category', val);
              const baseNode = val.includes('>') ? val.split('>').pop()!.trim() : val;
              updateItem(activeCategoryIndex, 'category_input', baseNode);
            }
            setCategoryModalVisible(false);
          }}
        />
      </ScrollView>
    </View>
  );
}
