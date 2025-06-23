const API_URL = '/api/locations';

const map = L.map('map', {
  center: [33.656106, 35.977878],
  zoom: 15,
  zoomControl: true
});

L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
}).addTo(map);

const redIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

let selectedLatLng = null;
const colorPicker = document.getElementById('colorPicker');
const colorCircles = document.querySelectorAll('.color-circle');
let markers = {};

function loadLocations() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      data.forEach(loc => {
        const icon = loc.Color === 'green' ? greenIcon : redIcon;
        const marker = L.marker([loc.Latitude, loc.Longitude], { icon }).addTo(map);
        marker._id = loc.id;
        bindMarkerPopup(marker, loc.Color);
        markers[loc.id] = marker;
      });
    });
}

map.on('click', e => {
  selectedLatLng = e.latlng;
  colorPicker.style.display = 'flex';
});

colorCircles.forEach(circle => {
  circle.addEventListener('click', () => {
    const color = circle.dataset.color;
    if (!selectedLatLng) return alert("يجب تحديد نقطة على الخريطة أولاً");
    colorPicker.style.display = 'none';

    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        Latitude: selectedLatLng.lat,
        Longitude: selectedLatLng.lng,
        Color: color
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        const icon = color === 'green' ? greenIcon : redIcon;
        const marker = L.marker([selectedLatLng.lat, selectedLatLng.lng], { icon }).addTo(map);
        marker._id = data.id;
        bindMarkerPopup(marker, color);
        markers[data.id] = marker;
        alert("تمت الإضافة بنجاح!");
        selectedLatLng = null;
      } else {
        alert("حدث خطأ أثناء الإضافة.");
      }
    })
    .catch(() => alert("فشل الاتصال بالخادم."));
  });
});

function bindMarkerPopup(marker, currentColor) {
  const oppositeColor = currentColor === 'red' ? 'green' : 'red';
  marker.bindPopup(`
    <button onclick="changeColor(${marker._id}, '${currentColor}')" style="margin-bottom:5px;">
      تغيير إلى اللون ${oppositeColor === 'red' ? 'أحمر' : 'أخضر'}
    </button><br>
    <button onclick="deleteMarker(${marker._id})" style="background-color:#dc3545; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
      حذف النقطة
    </button>
  `);
}

window.changeColor = (id, currentColor) => {
  const newColor = currentColor === 'red' ? 'green' : 'red';
  fetch(API_URL, {
    method: 'PUT',
    body: JSON.stringify({ id, Color: newColor }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(() => {
    if (markers[id]) {
      const icon = newColor === 'green' ? greenIcon : redIcon;
      markers[id].setIcon(icon);
      markers[id].closePopup();
      bindMarkerPopup(markers[id], newColor);
    }
  })
  .catch(() => alert("فشل تغيير اللون."));
};

window.deleteMarker = (id) => {
  if (!confirm('هل أنت متأكد من حذف هذه النقطة؟')) return;

  fetch(API_URL, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(() => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  })
  .catch(() => alert("فشل حذف النقطة."));
};

loadLocations();
