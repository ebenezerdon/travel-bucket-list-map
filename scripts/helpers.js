// scripts/helpers.js
// Responsibilities: storage utilities, id generation, format helpers.
// Exposes window.App.Storage and window.App.Utils
(function(){
  window.App = window.App || {};

  const STORAGE_KEY = 'teda_bucket_pins_v1';

  window.App.Storage = {
    loadPins: function(){
      try{
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        if(!Array.isArray(parsed)) return [];
        return parsed;
      }catch(e){
        console.error('Failed to load pins', e);
        return [];
      }
    },
    savePins: function(pins){
      try{
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
        return true;
      }catch(e){
        console.error('Failed to save pins', e);
        return false;
      }
    },
    clearPins: function(){
      try{
        window.localStorage.removeItem(STORAGE_KEY);
        return true;
      }catch(e){
        console.error('Failed to clear pins', e);
        return false;
      }
    }
  };

  window.App.Utils = {
    generateId: function(){
      return 'pin_' + Date.now().toString(36) + '_' + Math.floor(Math.random()*10000).toString(36);
    },
    clampPercent: function(n){
      const num = Number(n);
      if(Number.isNaN(num)) return 50;
      if(num < 0) return 0;
      if(num > 100) return 100;
      return Math.round(num * 10) / 10;
    },
    formatDateShort: function(ts){
      if(!ts) return '';
      try{
        const d = new Date(ts);
        return d.toLocaleDateString();
      }catch(e){
        return '';
      }
    },
    safeParseInt: function(v, fallback){
      const n = parseInt(v,10);
      return Number.isNaN(n)? fallback : n;
    }
  };
})();
