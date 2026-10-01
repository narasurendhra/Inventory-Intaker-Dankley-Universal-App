/**
 * PosAdapterFactory.js
 * 
 * Factory that dynamically instantiates and returns the correct POS Adapter
 * based on the operator's authenticated store location.
 * 
 * Supports:
 * - Dutchie POS (Dankley Location 2)
 * - BLAZE POS (Dankley New Migration Baseline)
 * - Alleaves POS (Dankley Queens Store)
 * - Mock POS (Zero-dependency Sandbox for Developers)
 */

const DutchiePosAdapter = require('./DutchiePosAdapter');
const BlazePosAdapter = require('./BlazePosAdapter');
const AlleavesPosAdapter = require('./AlleavesPosAdapter');
const MockPosAdapter = require('./MockPosAdapter');
const dankleyLocations = require('../../config/dankleyLocations.json');

class PosAdapterFactory {
  /**
   * Resolve POS adapter instance for a location or user profile
   * @param {string|object} locationOrUser Location ID string or user session object
   * @returns {BasePosAdapter} Concrete POS Adapter instance
   */
  static getAdapter(locationOrUser) {
    let locationId = typeof locationOrUser === 'string' 
      ? locationOrUser 
      : (locationOrUser?.locationId || process.env.DEFAULT_LOCATION_ID || 'sandbox');

    const locationConfig = dankleyLocations.locations[locationId] || dankleyLocations.locations['sandbox'];
    const posType = locationConfig?.posType || process.env.DEFAULT_POS_TYPE || 'mock';

    switch (posType.toLowerCase()) {
      case 'dutchie':
        return new DutchiePosAdapter(locationConfig?.posConfig || {});
      case 'blaze':
        return new BlazePosAdapter(locationConfig?.posConfig || {});
      case 'alleaves':
        return new AlleavesPosAdapter(locationConfig?.posConfig || {});
      case 'mock':
      default:
        return new MockPosAdapter(locationConfig?.posConfig || {});
    }
  }

  /**
   * Get all registered locations and their POS capabilities
   */
  static getLocations() {
    return Object.values(dankleyLocations.locations).map(loc => ({
      id: loc.id,
      name: loc.name,
      posType: loc.posType,
      defaultModel: loc.defaultModel
    }));
  }
}

module.exports = PosAdapterFactory;
