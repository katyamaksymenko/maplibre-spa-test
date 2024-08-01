<template>
  <header class="text-base text-blue-900">
    <button
      class="p-5"
      :class="{
        'border-b-2 border-blue-500 text-blue-500': activeTab === 'tab1',
        'text-gray-500': activeTab !== 'tab1'
      }"
      @click="activeTab = 'tab1'"
    >
      Карта
    </button>
    <button
      class="p-5"
      :class="{
        'border-b-2 border-blue-500 text-blue-500': activeTab === 'tab2',
        'text-gray-500': activeTab !== 'tab2'
      }"
      @click="activeTab = 'tab2'"
    >
      Таблиця
    </button>
  </header>

  <div v-show="activeTab === 'tab1'" class="flex pt-8 ">
    <div class="w-[80%] h-[60em] mr-6" ref="mapContainer"></div>
    <div class="mb-4 mr-6">
      <label class="block mb-2 text-lg">Select Color:</label>
      <Sketch :modelValue="color.hex" @update:modelValue="updateColor" />
    </div>
    <div>
      <div class="mb-4">
        <label class="block mb-2 text-lg">Line Width:</label>
        <input
          type="number"
          v-model.number="lineWidth"
          min="1"
          step="1"
          class="border rounded px-2 py-1"
        />
      </div>
      <div class="mb-12">
        <label class="block mb-2 text-lg">Line Style:</label>
        <select v-model="lineStyle" class="border rounded px-2 py-1">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      <div class="mb-12">
        <label class="block mb-12 text-lg">Opacity:</label>
        <input
          type="range"
          v-model.number="opacity"
          min="0"
          max="1"
          step="0.01"
          class="w-full"
        />
        <span class="text-gray-600">{{ (opacity * 100).toFixed(0) }}%</span>
      </div>
      <button
        @click="exportGeoJSON"
        class="mt-12 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Екаспорт GeoJSON
      </button>
      <button
        @click="exportToTable"
        class="mt-12 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Додати в таблицю
      </button>
    </div>
  </div>

  <div v-if="activeTab === 'tab2'" class="pt-8">
    <table class="table-auto border-collapse w-full">
      <thead>
        <tr>
          <th class="border px-4 py-2">ID</th>
          <th class="border px-4 py-2">Type</th>
          <th class="border px-4 py-2">Coordinates</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(feature, index) in geojsonFeatures" :key="index">
          <td class="border px-4 py-2">{{ index + 1 }}</td>
          <td class="border px-4 py-2">{{ feature.geometry.type }}</td>
          <td class="border px-4 py-2">{{ formatCoordinates(feature.geometry.coordinates) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Sketch } from '@ckpack/vue-color';
import 'leaflet-draw';

export default defineComponent({
  name: 'MapView',
  components: { Sketch },
  setup() {
    const mapContainer = ref<HTMLDivElement | null>(null);
    const color = ref({ hex: '#FF0000' }); // Default color
    const lineWidth = ref(2); // Default line width
    const lineStyle = ref('solid'); // Default line style
    const opacity = ref(1); // Default opacity (fully opaque)
    const activeTab = ref('tab1');
    const geojsonFeatures = ref<any[]>([]); // Зберігаємо GeoJSON функції

    let map: LeafletMap;
    let drawnItems: L.FeatureGroup;

    onMounted(() => {
      if (mapContainer.value) {
        // Initialize the map
        map = L.map(mapContainer.value).setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Initialize FeatureGroup to store editable layers
        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialize the draw control and pass it the FeatureGroup of editable layers
        const drawControl = new L.Control.Draw({
          edit: {
            featureGroup: drawnItems,
            selectedPathOptions: {
              maintainColor: true,
              color: color.value.hex,
              opacity: opacity.value
            }
          },
          draw: {
            polygon: {
              shapeOptions: getStyle()
            },
            polyline: {
              shapeOptions: getStyle()
            },
            marker: false,
            circle: false,
            rectangle: false
          }
        });
        map.addControl(drawControl);

        // Event listener for created layers
        map.on(L.Draw.Event.CREATED, (event: any) => {
          const layer = event.layer;
          drawnItems.addLayer(layer);
          updateStyle();
          updateGeoJSONFeatures();
        });

        // Event listener for edited layers
        map.on(L.Draw.Event.EDITED, () => {
          updateStyle();
          updateGeoJSONFeatures();
        });
      }
    });

    const getStyle = () => ({
      color: color.value.hex,
      weight: lineWidth.value,
      dashArray: lineStyle.value === 'dashed' ? '5, 5' : lineStyle.value === 'dotted' ? '1, 5' : '',
      opacity: opacity.value
    });

    const updateStyle = () => {
      drawnItems.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
          layer.setStyle(getStyle());
        }
      });
    };

    const updateColor = (newColor: { hex: string }) => {
      color.value.hex = newColor.hex;
      updateStyle();
    };

    const exportGeoJSON = () => {
      const geojsonData = drawnItems.toGeoJSON();
      geojsonFeatures.value.push(...(geojsonData as any).features); // Додаємо нові GeoJSON функції до списку
      const geojsonString = JSON.stringify(geojsonData, null, 2);
      const blob = new Blob([geojsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geometry.geojson';
      a.click();
      URL.revokeObjectURL(url);
    };

    const exportToTable = () => {
      const geojsonData = drawnItems.toGeoJSON();
      geojsonFeatures.value.push(...(geojsonData as any).features);
    };


    const formatCoordinates = (coords: any) => {
      if (Array.isArray(coords[0])) {
        return coords.map((coord: any) => coord.join(', ')).join(' | ');
      }
      return coords.join(', ');
    };

    const updateGeoJSONFeatures = () => {
      const geojsonData = drawnItems.toGeoJSON();
      geojsonFeatures.value = (geojsonData as any).features;
    };

    // Watch for changes in style properties and update style
    watch([color, lineWidth, lineStyle, opacity], updateStyle, { deep: true });

    return {
      mapContainer,
      color,
      lineWidth,
      lineStyle,
      opacity,
      updateColor,
      exportGeoJSON, 
      activeTab,
      geojsonFeatures,
      formatCoordinates
    };
  }
});
</script>

    
