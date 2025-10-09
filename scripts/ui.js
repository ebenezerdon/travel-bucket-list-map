// scripts/ui.js
// Responsibilities: render UI, handle events, manage app state and interactions.
// This file defines window.App.init and window.App.render inside an IIFE.
(function(){
  window.App = window.App || {};

  // Local in-module state
  const state = {
    pins: [],
    editingPinId: null,
    lastClickPercent: {x:50,y:50}
  };

  // Utility shortcuts
  const $doc = $(document);

  // Private helpers
  function computeStats(pins){
    const total = pins.length;
    const visited = pins.filter(p=>p.status === 'visited').length;
    const percent = total === 0 ? 0 : Math.round((visited/total)*100);
    return { total, visited, percent };
  }

  function createPinElement(pin){
    // Use template literal for multi-line HTML
    const title = $('<div>').text(pin.title).html();
    const el = $(`
      <div class="pin" data-id="${pin.id}" tabindex="0" role="button" aria-pressed="false">
        <div class="pin-label" aria-hidden>${title}</div>
        <div class="pin-dot" title="${title}" aria-label="Pin: ${title}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C8 6 6 8 6 12a6 6 0 1012 0c0-4-2-6-6-10z" fill="#ffffff" opacity="0.12"></path>
            <circle cx="12" cy="10" r="3" fill="#fff"></circle>
          </svg>
        </div>
      </div>
    `);

    el.css({ left: pin.x + '%', top: pin.y + '%' });

    // status color accent
    if(pin.status === 'visited'){
      el.find('.pin-dot').css({ background: 'linear-gradient(180deg, #06b6d4, #0891b2)' });
    }else if(pin.status === 'planned'){
      el.find('.pin-dot').css({ background: '#f59e0b' });
    }else{
      el.find('.pin-dot').css({ background: '#06b6d4' });
    }

    // keyboard/aria actions
    el.on('click keypress', function(e){
      if(e.type === 'keypress' && e.which !== 13 && e.which !== 32) return;
      e.preventDefault();
      const id = $(this).data('id');
      openEditModal(id);
    });

    return el;
  }

  function renderPins(){
    const $container = $('#pins-container');
    $container.empty();
    state.pins.forEach(pin => {
      const $pin = createPinElement(pin);
      // wrap in a positioned container for label handling
      const wrapper = $('<div>').addClass('absolute').css({ left: pin.x + '%', top: pin.y + '%' }).attr('data-id', pin.id);
      wrapper.append($pin);
      // ensure pointer events allowed
      wrapper.css('transform', 'translate(-50%, -100%)');
      // attach to container
      $container.append(wrapper);
    });
  }

  function renderList(filteredPins){
    const $list = $('#pin-list');
    $list.empty();
    if(filteredPins.length === 0){
      $list.append('<div class="text-sm text-slate-400">No pins yet. Add one by clicking the map.</div>');
      return;
    }
    filteredPins.forEach(pin => {
      const $item = $(`
        <button class="w-full text-left p-2 rounded-md hover:bg-slate-50 focus:bg-slate-50" data-id="${pin.id}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div style="width:36px;height:36px;border-radius:8px;overflow:hidden;background:#f8fafc;flex-shrink:0;display:flex;align-items:center;justify-content:center">
                ${pin.image ? `<img src="${pin.image}" alt="${$('<div>').text(pin.title).html()} photo" style="width:100%;height:100%;object-fit:cover">` : `<svg width=20 height=20 viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M12 2C8 6 6 8 6 12a6 6 0 1012 0c0-4-2-6-6-10z\" fill=\"#06b6d4\"></path></svg>`}
              </div>
              <div>
                <div class="text-sm font-medium">${$('<div>').text(pin.title).html()}</div>
                <div class="text-xs text-slate-500">${pin.status} • ${window.App.Utils.formatDateShort(pin.createdAt)}</div>
              </div>
            </div>
            <div class="text-xs text-slate-400">${Math.round(pin.x)}%, ${Math.round(pin.y)}%</div>
          </div>
        </button>
      `);
      $item.on('click', function(){ openEditModal(pin.id); });
      $list.append($item);
    });
  }

  function computeAndRenderStats(){
    const stats = computeStats(state.pins);
    $('#stat-total').text(`${stats.total} total`);
    $('#stat-visited').text(`${stats.visited} visited`);
    $('#progress-bar').css('width', stats.percent + '%');
  }

  function openModal(){
    $('#modal').removeClass('hidden').hide().fadeIn(200);
    $('#pin-title').focus();
  }
  function closeModal(){
    $('#modal').fadeOut(150, function(){ $(this).addClass('hidden'); });
    state.editingPinId = null;
    $('#pin-form')[0].reset();
    $('#photo-preview').empty().text('No photo');
    $('#delete-pin').addClass('hidden');
  }

  function openAddModal(x,y){
    state.editingPinId = null;
    $('#modal-title').text('Add pin');
    $('#pin-x').val(window.App.Utils.clampPercent(x));
    $('#pin-y').val(window.App.Utils.clampPercent(y));
    $('#pin-status').val('want');
    $('#delete-pin').addClass('hidden');
    openModal();
  }

  function openEditModal(id){
    const pin = state.pins.find(p=>p.id === id);
    if(!pin) return;
    state.editingPinId = id;
    $('#modal-title').text('Edit pin');
    $('#pin-title').val(pin.title);
    $('#pin-status').val(pin.status);
    $('#pin-notes').val(pin.notes || '');
    $('#pin-x').val(pin.x);
    $('#pin-y').val(pin.y);
    if(pin.image){
      $('#photo-preview').empty().append($(`<img src="${pin.image}" alt="photo preview">`));
    }else{
      $('#photo-preview').text('No photo');
    }
    $('#delete-pin').removeClass('hidden').off('click').on('click', function(){
      if(!confirm('Delete this pin?')) return;
      window.App.deletePin(id);
      closeModal();
    });
    openModal();
  }

  function applyFilters(){
    const filter = $('#filter-status').val();
    const query = ($('#search-input').val() || '').toLowerCase().trim();
    let filtered = state.pins.slice();
    if(filter && filter !== 'all') filtered = filtered.filter(p=>p.status === filter);
    if(query) filtered = filtered.filter(p => (p.title||'').toLowerCase().includes(query) || (p.notes||'').toLowerCase().includes(query));
    renderList(filtered);
    renderPins();
  }

  // Public App methods
  window.App.addPin = function(pin){
    try{
      pin.id = window.App.Utils.generateId();
      pin.createdAt = Date.now();
      state.pins.push(pin);
      window.App.Storage.savePins(state.pins);
      window.App.render();
      return pin.id;
    }catch(e){ console.error('addPin failed', e); return null; }
  };

  window.App.updatePin = function(id, updates){
    try{
      const idx = state.pins.findIndex(p => p.id === id);
      if(idx === -1) return false;
      state.pins[idx] = Object.assign({}, state.pins[idx], updates);
      if(state.pins[idx].status === 'visited'){
        state.pins[idx].visitedAt = state.pins[idx].visitedAt || Date.now();
      }
      window.App.Storage.savePins(state.pins);
      window.App.render();
      return true;
    }catch(e){ console.error('updatePin failed', e); return false; }
  };

  window.App.deletePin = function(id){
    try{
      state.pins = state.pins.filter(p=>p.id !== id);
      window.App.Storage.savePins(state.pins);
      window.App.render();
      return true;
    }catch(e){ console.error('deletePin failed', e); return false; }
  };

  // Import sample pins for demonstration
  window.App.importSample = function(){
    const sample = [
      { id: window.App.Utils.generateId(), title: 'Kyoto, Japan', notes: 'Cherry blossoms and temples', x: 62, y: 36, status: 'planned', image: '', createdAt: Date.now() - 1000*60*60*24*30 },
      { id: window.App.Utils.generateId(), title: 'Reykjavik, Iceland', notes: 'Northern lights and hot springs', x: 21, y: 20, status: 'want', image: '', createdAt: Date.now() - 1000*60*60*24*100 },
      { id: window.App.Utils.generateId(), title: 'Marrakesh, Morocco', notes: 'Markets and spices', x: 40, y: 48, status: 'visited', image: '', createdAt: Date.now() - 1000*60*60*24*400, visitedAt: Date.now() - 1000*60*60*24*365 }
    ];
    state.pins = sample.concat(state.pins);
    window.App.Storage.savePins(state.pins);
    window.App.render();
  };

  // Initialization and event wiring
  window.App.init = function(){
    try{
      // load
      state.pins = window.App.Storage.loadPins();

      // map click to add pin
      $('#map-wrapper').on('click', function(e){
        const $map = $('#world-map');
        const offset = $map.offset();
        const w = $map.width();
        const h = $map.height();
        if(!w || !h) return;
        const clickX = e.pageX - offset.left;
        const clickY = e.pageY - offset.top;
        const xPercent = window.App.Utils.clampPercent((clickX / w) * 100);
        const yPercent = window.App.Utils.clampPercent((clickY / h) * 100);
        state.lastClickPercent = { x: xPercent, y: yPercent };
        openAddModal(xPercent, yPercent);
      });

      // Add button
      $('#btn-add-pin').on('click', function(){
        openAddModal(state.lastClickPercent.x, state.lastClickPercent.y);
      });

      // sample import
      $('#btn-import-sample').on('click', function(){
        // warn user that demo data will be added
        if(!confirm('This will add demo pins to your current list. Continue?')) return;
        window.App.importSample();
      });
      // modal close handlers
      $('#modal').on('click', '[data-action="close"], [data-action="cancel"], [data-close="overlay"]', function(e){
        closeModal();
      });

      // file input preview
      $('#pin-photo').on('change', function(e){
        const file = e.target.files && e.target.files[0];
        if(!file) return;
        if(!file.type.startsWith('image/')){ alert('Please select an image file'); return; }
        if(file.size > 2.5 * 1024 * 1024){ alert('Image too large. Try under 2.5MB.'); return; }
        const reader = new FileReader();
        reader.onload = function(ev){
          $('#photo-preview').empty().append($(`<img src="${ev.target.result}" alt="preview">`));
          $('#photo-preview img').attr('loading','lazy');
          $('#photo-preview img').css({ width: '100%', height: '100%', objectFit: 'cover' });
          $('#pin-form').data('photo', ev.target.result);
        };
        reader.readAsDataURL(file);
      });

      // form submit create or update
      $('#pin-form').on('submit', function(e){
        e.preventDefault();
        const title = $('#pin-title').val().trim();
        const status = $('#pin-status').val();
        const notes = $('#pin-notes').val().trim();
        let x = window.App.Utils.clampPercent(parseFloat($('#pin-x').val()));
        let y = window.App.Utils.clampPercent(parseFloat($('#pin-y').val()));
        if(!title){ alert('Please add a title for the pin'); $('#pin-title').focus(); return; }
        const image = $(this).data('photo') || null;
        if(state.editingPinId){
          const success = window.App.updatePin(state.editingPinId, { title, status, notes, x, y, image });
          if(success) closeModal();
        }else{
          const id = window.App.addPin({ title, status, notes, x, y, image });
          if(id) closeModal();
        }
      });

      // filters and search
      $('#filter-status').on('change', applyFilters);
      $('#search-input').on('input', function(){ window.setTimeout(applyFilters, 120); });

      // keyboard shortcuts
      $doc.on('keydown', function(e){
        if(e.key === 'n' || e.key === 'N'){
          e.preventDefault(); openAddModal(state.lastClickPercent.x, state.lastClickPercent.y);
        }
      });

      // accessibility: trap focus in modal when open
      $doc.on('focusin', function(e){
        if(!$('#modal').hasClass('hidden')){
          if($.contains($('#modal')[0], e.target) === false){
            $('#modal').find('[data-action="close"]').focus();
          }
        }
      });

    }catch(e){ console.error('App.init error', e); }
  };

  window.App.render = function(){
    try{
      // reload from storage to ensure persistence
      state.pins = window.App.Storage.loadPins();
      renderPins();
      applyFilters();
      computeAndRenderStats();
    }catch(e){ console.error('App.render error', e); }
  };

})();
