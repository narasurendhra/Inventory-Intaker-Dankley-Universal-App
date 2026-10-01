import { authService } from './authService';

const getBaseUrl = (): string => authService.getApiBaseUrl() || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Bypass-Tunnel-Reminder': 'true',
  'ngrok-skip-browser-warning': '69420'
};

export async function uploadImageAsync(
  localUri: string,
  index: number,
  sessionId: string,
  allowedCategories: string[],
  liveBrands: string[]
): Promise<any> {
  const formData = new FormData();
  formData.append('images', {
    uri: localUri,
    name: `image_${index}.jpg`,
    type: 'image/jpeg'
  } as any);
  formData.append('sessionId', sessionId);
  formData.append('imageIndex', String(index));
  formData.append('allowedCategories', allowedCategories.join(', '));
  formData.append('liveBrands', liveBrands.join(', '));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}/process-image-async`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 180000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`HTTP Error ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Upload timed out after 3 minutes'));
    xhr.send(formData);
  });
}

export async function fetchPackageCost(uid: string): Promise<any> {
  const ts = new Date().getTime();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${getBaseUrl()}/mcp/package-cost?uid=${uid}&_cb=${ts}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 30000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `Server Error ${xhr.status}`));
        } catch {
          reject(new Error(`Server Error ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Package cost request timed out'));
    xhr.send();
  });
}

export async function fetchBrandItems(brandName: string): Promise<any> {
  const payload = JSON.stringify({ brandName });
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}/get-brand-items`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 30000;
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve({ success: false, brandItems: [] });
      }
    };
    xhr.onerror = () => resolve({ success: false, brandItems: [] });
    xhr.ontimeout = () => resolve({ success: false, brandItems: [] });
    xhr.send(payload);
  });
}

export async function fetchCategoriesAndBrands(): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${getBaseUrl()}/mcp/categories`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 30000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON from server'));
        }
      } else {
        reject(new Error(`HTTP Error ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Categories request timed out'));
    xhr.send();
  });
}

export async function analyzeSessionImages(sessionId: string): Promise<any> {
  const payload = JSON.stringify({ sessionId });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}/process-intake`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 300000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          if (xhr.status === 524) {
            reject(new Error('Gateway Timeout (Cloudflare 524): Backend AI request took longer than 100 seconds. Please try again.'));
          } else {
            reject(new Error(`Server response error (HTTP ${xhr.status})`));
          }
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Network request timed out after 5 minutes'));
    xhr.send(payload);
  });
}

export async function previewIntakeApi(items: any[], manifestData: any): Promise<any> {
  const payload = JSON.stringify({ items, manifestData });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}/preview-intake`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 300000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error(`Server Error: ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Preview request timed out after 5 minutes'));
    xhr.send(payload);
  });
}

export async function submitIntakeApi(
  items: any[],
  manifestData: any,
  printSettings: any,
  sessionId: string,
  dryRun: boolean = false
): Promise<any> {
  const payload = JSON.stringify({
    items,
    manifestData: { ...manifestData, sessionId },
    printSettings,
    sessionId,
    dryRun
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}/submit-intake`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 300000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error(`Server Error: ${xhr.status}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Submission request timed out after 5 minutes'));
    xhr.send(payload);
  });
}

export async function fetchJobStatus(manifestNumber: string): Promise<any> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${getBaseUrl()}/job-status?manifest_number=${manifestNumber}&_cb=${Date.now()}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Bypass-Tunnel-Reminder', 'true');
    xhr.setRequestHeader('ngrok-skip-browser-warning', '69420');
    xhr.timeout = 15000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.ontimeout = () => resolve(null);
    xhr.send();
  });
}
