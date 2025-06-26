const API_URL = '/api/locations';

const map = L.map('map', {
  center: [33.656106, 35.977878],
  zoom: 18,
  zoomControl: true
});

L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
}).addTo(map);

function createCircleMarker(latlng, color) {
  return L.circleMarker(latlng, {
    radius: 3,
    color: color === 'green' ? 'rgb(14, 249, 14)' : 'red',
    fillColor: color === 'green' ? 'rgb(14, 249, 14)' : 'red',
    fillOpacity: 1,
    weight: 1
  }).addTo(map);
}

let selectedLatLng = null;
let selectedColor = null;
const colorPicker = document.getElementById('colorPicker');
const colorCircles = document.querySelectorAll('.color-circle');
const noteInput = document.getElementById('noteInput');
let markers = {};

let redCount = 0;
let greenCount = 0;
const redCountElement = document.getElementById('redCount');
const greenCountElement = document.getElementById('greenCount');

function updateCountersDisplay() {
  redCountElement.textContent = redCount;
  greenCountElement.textContent = greenCount;
}

const saveButton = document.getElementById('savePoint');
const cancelButton = document.getElementById('cancelPoint');

cancelButton.addEventListener('click', () => {
  selectedLatLng = null;
  selectedColor = null;
  noteInput.value = '';
  document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  colorPicker.style.display = 'none';
});

function loadLocations() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      redCount = 0;
      greenCount = 0;

      data.forEach(loc => {
        const marker = createCircleMarker([loc.Latitude, loc.Longitude], loc.Color);
        marker._id = loc._id;
        marker.note = loc.Note;
        bindMarkerPopup(marker, loc.Color, loc.Note);
        markers[loc._id] = marker;

        if (loc.Color === 'red') redCount++;
        else if (loc.Color === 'green') greenCount++;
      });

      updateCountersDisplay();
    });
}

map.on('click', e => {
  selectedLatLng = e.latlng;
  selectedColor = null;
  noteInput.value = '';
  document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  colorPicker.style.display = 'flex';
});

// اختيار اللون
colorCircles.forEach(circle => {
  circle.addEventListener('click', () => {
    selectedColor = circle.dataset.color;
    document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
    circle.classList.add('selected');
  });
});

// عند الضغط على زر الحفظ
saveButton.addEventListener('click', () => {
  if (!selectedLatLng) return;

  if (!selectedColor) {
    alert("رجاءً اختر لونًا أولا");
    return;
  }

  const noteText = noteInput.value.trim();

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      Latitude: selectedLatLng.lat,
      Longitude: selectedLatLng.lng,
      Color: selectedColor,
      Note: noteText
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(data => {
    if (data._id) {
      const marker = createCircleMarker([selectedLatLng.lat, selectedLatLng.lng], selectedColor);
      marker._id = data._id;
      marker.note = noteText;
      bindMarkerPopup(marker, selectedColor, noteText);
      markers[data._id] = marker;

      if (selectedColor === 'red') redCount++;
      else if (selectedColor === 'green') greenCount++;

      updateCountersDisplay();

      selectedLatLng = null;
      colorPicker.style.display = 'none';
    } else {
      alert("حدث خطأ أثناء الإضافة.");
    }
  })
  .catch(() => alert("فشل الاتصال بالخادم."));
});

function bindMarkerPopup(marker, currentColor, noteText = '') {
  const oppositeColor = currentColor === 'red' ? 'rgb(14, 249, 14)' : 'red';
  const displayColorName = oppositeColor === 'red' ? 'أحمر' : 'أخضر';

  const noteDisplay = noteText
    ? `<p style="margin-bottom:5px;">📝 <strong>الملاحظة:</strong> ${noteText}</p>`
    : '<p style="margin-bottom:5px;">📝 لا يوجد ملاحظة</p>';

  marker.bindPopup(`
    ${noteDisplay}
    <button onclick="changeColor('${marker._id}', '${currentColor}')" style="
      margin-bottom:5px; 
      background:#ffc107; 
      border:none; 
      padding:5px 10px; 
      border-radius:4px; 
      cursor:pointer;">
      تغيير إلى اللون ${displayColorName}
    </button><br>
    <button onclick="deleteMarker('${marker._id}')" style="
      background:#dc3545; 
      color:white; 
      border:none; 
      padding:5px 10px; 
      border-radius:4px; 
      cursor:pointer;">
      حذف النقطة
    </button>
  `);
}

window.changeColor = (id, currentColor) => {
  const marker = markers[id];
  if (!marker) return;

  const newColor = currentColor === 'red' ? 'green' : 'red';
  const note = marker.note || '';

  fetch(API_URL, {
    method: 'PUT',
    body: JSON.stringify({
      id: id,
      Color: newColor,
      Note: note
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(() => {
    marker.setStyle({
      color: newColor === 'green' ? 'rgb(14, 249, 14)' : 'red',
      fillColor: newColor === 'green' ? 'rgb(14, 249, 14)' : 'red'
    });

    if (currentColor === 'red') {
      redCount--;
      greenCount++;
    } else {
      greenCount--;
      redCount++;
    }
    updateCountersDisplay();

    marker.closePopup();
    bindMarkerPopup(marker, newColor, note);
    marker.note = note;
  })
  .catch(() => alert("فشل تغيير اللون."));
};

window.deleteMarker = (id) => {
  if (!confirm('هل أنت متأكد من حذف هذه النقطة؟')) return;

  const marker = markers[id];
  if (!marker) return;

  const deletedColor = marker.options.color;

  fetch(API_URL, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(() => {
    map.removeLayer(marker);
    delete markers[id];

    if (deletedColor === 'red') redCount--;
    else if (deletedColor === 'rgb(14, 249, 14)') greenCount--;

    updateCountersDisplay();
  })
  .catch(() => alert("فشل حذف النقطة."));
};

loadLocations();

