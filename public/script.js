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

// زر الحفظ (يضاف مرة واحدة)
let saveButton = document.createElement('button');
saveButton.id = 'savePoint';
saveButton.textContent = 'حفظ النقطة';
saveButton.style.marginTop = '10px';
saveButton.style.padding = '8px';
saveButton.style.backgroundColor = '#28a745';
saveButton.style.color = 'white';
saveButton.style.border = 'none';
saveButton.style.borderRadius = '5px';
saveButton.style.cursor = 'pointer';
colorPicker.appendChild(saveButton);

function loadLocations() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      data.forEach(loc => {
        const marker = createCircleMarker([loc.Latitude, loc.Longitude], loc.Color);
        marker._id = loc._id;
        marker.note = loc.Note;  // ✅ حفظ الملاحظة داخل الـ Marker نفسه
        bindMarkerPopup(marker, loc.Color, loc.Note);
        markers[loc._id] = marker;
      });
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
      bindMarkerPopup(marker, selectedColor, noteText);
      markers[data._id] = marker;
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

  const newColor = currentColor === 'red' ? 'rgb(14, 249, 14)' : 'red';

  fetch(API_URL, {
    method: 'PUT',
    body: JSON.stringify({
      id: id,
      Color: newColor,
      Note: marker.note || ''  // ✅ إرسال الملاحظة الحالية
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(() => {
    marker.setStyle({
      color: newColor,
      fillColor: newColor
    });
    marker.closePopup();
    bindMarkerPopup(marker, newColor, marker.note);  // ✅ إعادة ربط الـ Popup مع نفس الملاحظة
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
  .then(res => res.json())
  .then(() => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  })
  .catch(() => alert("فشل حذف النقطة."));
};

loadLocations();










// const API_URL = '/api/locations';

// const map = L.map('map', {
//   center: [33.656106, 35.977878],
//   zoom: 18,
//   zoomControl: true
// });

// L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
//   attribution: 'Tiles © Esri'
// }).addTo(map);

// function createCircleMarker(latlng, color) {
//   return L.circleMarker(latlng, {
//     radius: 3,
//     color: color === 'green' ? 'rgb(14, 249, 14)' : 'red',
//     fillColor: color === 'green' ? 'rgb(14, 249, 14)' : 'red',
//     fillOpacity: 1,
//     weight: 1
//   }).addTo(map);
// }

// let selectedLatLng = null;
// const colorPicker = document.getElementById('colorPicker');
// const colorCircles = document.querySelectorAll('.color-circle');
// let markers = {};

// function loadLocations() {
//   fetch(API_URL)
//     .then(res => res.json())
//     .then(data => {
//       data.forEach(loc => {
//         const marker = createCircleMarker([loc.Latitude, loc.Longitude], loc.Color);
//         marker._id = loc._id;
//         bindMarkerPopup(marker, loc.Color, loc.Note);
//         markers[loc._id] = marker;
//       });
//     });
// }

// map.on('click', e => {
//   selectedLatLng = e.latlng;
//   colorPicker.style.display = 'flex';
// });

// // عند اختيار لون
// colorCircles.forEach(circle => {
//   circle.addEventListener('click', () => {
//     const color = circle.dataset.color;
//     if (!selectedLatLng) return alert("يجب تحديد نقطة على الخريطة أولاً");

//     const userNote = prompt("أدخل ملاحظة لهذه النقطة (يمكن تركها فارغة):", "");

//     colorPicker.style.display = 'none';

//     fetch(API_URL, {
//       method: 'POST',
//       body: JSON.stringify({
//         Latitude: selectedLatLng.lat,
//         Longitude: selectedLatLng.lng,
//         Color: color,
//         Note: userNote || ''
//       }),
//       headers: { 'Content-Type': 'application/json' }
//     })
//     .then(res => res.json())
//     .then(data => {
//       if (data._id) {
//         const marker = createCircleMarker([selectedLatLng.lat, selectedLatLng.lng], color);
//         marker._id = data._id;
//         bindMarkerPopup(marker, color, data.Note);
//         markers[data._id] = marker;
//         alert("تمت الإضافة بنجاح!");
//         selectedLatLng = null;
//       } else {
//         alert("حدث خطأ أثناء الإضافة.");
//       }
//     })
//     .catch(() => alert("فشل الاتصال بالخادم."));
//   });
// });

// function bindMarkerPopup(marker, currentColor, noteText = '') {
//   const oppositeColor = currentColor === 'red' ? 'rgb(14, 249, 14)' : 'red';
//   const noteDisplay = noteText ? `<p>ملاحظة: ${noteText}</p>` : '';

//   marker.bindPopup(`
//     ${noteDisplay}
//     <button onclick="changeColor('${marker._id}', '${currentColor}')" style="margin-bottom:5px;">
//       تغيير إلى اللون ${oppositeColor === 'red' ? 'أحمر' : 'أخضر'}
//     </button><br>
//     <button onclick="deleteMarker('${marker._id}')" style="background-color:#dc3545; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
//       حذف النقطة
//     </button>
//   `);
// }

// window.changeColor = (id, currentColor) => {
//   const newColor = currentColor === 'red' ? 'rgb(14, 249, 14)' : 'red';
//   fetch(API_URL, {
//     method: 'PUT',
//     body: JSON.stringify({ id, Color: newColor }),
//     headers: { 'Content-Type': 'application/json' }
//   })
//   .then(res => res.json())
//   .then(() => {
//     if (markers[id]) {
//       markers[id].setStyle({
//         color: newColor,
//         fillColor: newColor
//       });
//       markers[id].closePopup();
//       bindMarkerPopup(markers[id], newColor, markers[id].options.note);
//     }
//   })
//   .catch(() => alert("فشل تغيير اللون."));
// };

// window.deleteMarker = (id) => {
//   if (!confirm('هل أنت متأكد من حذف هذه النقطة؟')) return;

//   fetch(API_URL, {
//     method: 'DELETE',
//     body: JSON.stringify({ id }),
//     headers: { 'Content-Type': 'application/json' }
//   })
//   .then(res => res.json())
//   .then(() => {
//     if (markers[id]) {
//       map.removeLayer(markers[id]);
//       delete markers[id];
//     }
//   })
//   .catch(() => alert("فشل حذف النقطة."));
// };

// loadLocations();



// const API_URL = '/api/locations';

// const map = L.map('map', {
//   center: [33.656106, 35.977878],
//   zoom: 18,
//   zoomControl: true
// });


// L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
//   attribution: 'Tiles © Esri'
// }).addTo(map);

// function createCircleMarker(latlng, color) {
//   return L.circleMarker(latlng, {
//     radius: 3,
//     color: color === 'green' ? 'rgb(14, 249, 14)' : 'red',    
//     fillColor: color === 'green' ? 'rgb(14, 249, 14)' : 'red', 
//     fillOpacity: 1,
//     weight: 1
//   }).addTo(map);
// }

// let selectedLatLng = null;
// const colorPicker = document.getElementById('colorPicker');
// const colorCircles = document.querySelectorAll('.color-circle');
// let markers = {};

// function loadLocations() {
//   fetch(API_URL)
//     .then(res => res.json())
//     .then(data => {
//       data.forEach(loc => {
//         const marker = createCircleMarker([loc.Latitude, loc.Longitude], loc.Color);
//         marker._id = loc.id;
//         bindMarkerPopup(marker, loc.Color);
//         markers[loc.id] = marker;
//       });
//     });
// }

// map.on('click', e => {
//   selectedLatLng = e.latlng;
//   colorPicker.style.display = 'flex';
// });

// colorCircles.forEach(circle => {
//   circle.addEventListener('click', () => {
//     const color = circle.dataset.color;
//     if (!selectedLatLng) return alert("يجب تحديد نقطة على الخريطة أولاً");
//     colorPicker.style.display = 'none';

//     fetch(API_URL, {
//       method: 'POST',
//       body: JSON.stringify({
//         Latitude: selectedLatLng.lat,
//         Longitude: selectedLatLng.lng,
//         Color: color
//       }),
//       headers: { 'Content-Type': 'application/json' }
//     })
//     .then(res => res.json())
//     .then(data => {
//       if (data.id) {
//         const marker = createCircleMarker([selectedLatLng.lat, selectedLatLng.lng], color);
//         marker._id = data.id;
//         bindMarkerPopup(marker, color);
//         markers[data.id] = marker;
//         alert("تمت الإضافة بنجاح!");
//         selectedLatLng = null;
//       } else {
//         alert("حدث خطأ أثناء الإضافة.");
//       }
//     })
//     .catch(() => alert("فشل الاتصال بالخادم."));
//   });
// });

// function bindMarkerPopup(marker, currentColor) {
//   const oppositeColor = currentColor === 'red' ? 'rgb(14, 249, 14)' : 'red';
//   marker.bindPopup(`
//     <button onclick="changeColor(${marker._id}, '${currentColor}')" style="margin-bottom:5px;">
//       تغيير إلى اللون ${oppositeColor === 'red' ? 'أحمر' : 'أخضر'}
//     </button><br>
//     <button onclick="deleteMarker(${marker._id})" style="background-color:#dc3545; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
//       حذف النقطة
//     </button>
//   `);
// }

// window.changeColor = (id, currentColor) => {
//   const newColor = currentColor === 'red' ? 'rgb(14, 249, 14)' : 'red';
//   fetch(API_URL, {
//     method: 'PUT',
//     body: JSON.stringify({ id, Color: newColor }),
//     headers: { 'Content-Type': 'application/json' }
//   })
//   .then(() => {
//     if (markers[id]) {
//       markers[id].setStyle({
//         color: newColor,
//         fillColor: newColor
//       });
//       markers[id].closePopup();
//       bindMarkerPopup(markers[id], newColor);
//     }
//   })
//   .catch(() => alert("فشل تغيير اللون."));
// };

// window.deleteMarker = (id) => {
//   if (!confirm('هل أنت متأكد من حذف هذه النقطة؟')) return;

//   fetch(API_URL, {
//     method: 'DELETE',
//     body: JSON.stringify({ id }),
//     headers: { 'Content-Type': 'application/json' }
//   })
//   .then(() => {
//     if (markers[id]) {
//       map.removeLayer(markers[id]);
//       delete markers[id];
//     }
//   })
//   .catch(() => alert("فشل حذف النقطة."));
// };

// loadLocations();
