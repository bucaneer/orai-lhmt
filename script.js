/**
 * Copyright 2024 Justas Lavišius <bucaneer@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

const chart_id = 'chart-container';
const forecast_header_id = 'forecast-header';
const observations_header_id = 'observations-header';
const places = [];
const stations = [];
const modes = ['forecast', 'observations'];
var place;
var place_input;
var station;
var station_input;
var coords;
var mode = 'forecast';

const chart_template = {
  type: "line",
  height: "22%",
  width: "100%",
  plot: {
    smartSampling: true,
    maxTrackers: 0,
    tooltip: {
      visible: false,
    },
  },
  backgroundColor: '#fefefc',
  plotarea: {
    margin: 'dynamic',
    backgroundColor: '#f5f5f5',
    marginLeft: 20,
    marginRight: 40,
    marginTop: 7,
    marginBottom: 0,
  },
  crosshairX: {
    shared: true,
    exact: true,
    plotLabel: {
      fontSize: 14,
      backgroundColor: 'white',
      borderColor: 'white',
      borderWidth: 2,
      borderRadius: 5,
      shadow: true,
    },
    scaleLabel: {
      fontSize: 13,
      transform: {
        type: 'date',
        all: '%D, %mm-%dd <b>%H:%i</b>',
      },
    },
  },
  scaleX: {
    step: "1hour",
    transform: {
      type: 'date',
      all: '<b>%D</b>, %mm-%dd %H:%i',
    },
    normalize: false,
    guide: {
      lineColor: '#ffffff',
    },
  },
  scaleY: {
    refValue: 0,
    refLine: {
      visible: true,
      lineColor: '#ffffff',
      lineWidth: 2,
    },
    guide: {
      lineColor: '#ffffff',
    },
    item: {
      width: 25,
    },
  }
};

const condition_codes = {
  'clear': {label: 'Giedra'},
  'partly-cloudy': {label: 'Mažai debesuota'},
  'variable-cloudiness': {label: 'Nepastoviai debesuota'},
  'cloudy-with-sunny-intervals': {label: 'Debesuota su pragiedruliais'},
  'cloudy': {label: 'Debesuota'},
  'thunder': {label: 'Perkūnija'},
  'isolated-thunderstorms': {label: 'Trumpas lietus su perkūnija'},
  'thunderstorms': {label: 'Lietus su perkūnija'},
  'heavy-rain-with-thunderstorms': {label: 'Smarkus lietus su perkūnija'},
  'light-rain': {label: 'Nedidelis lietus'},
  'rain': {label: 'Lietus'},
  'heavy-rain': {label: 'Smarkus lietus'},
  'rain-showers': {label: 'Trumpas lietus'},
  'light-rain-at-times': {label: 'Protarpiais nedidelis lietus'},
  'rain-at-times': {label: 'Protarpiais lietus'},
  'light-sleet': {label: 'Nedidelė šlapdriba'},
  'sleet': {label: 'Šlapdriba'},
  'sleet-at-times': {label: 'Protarpiais šlapdriba'},
  'sleet-showers': {label: 'Trumpa šlapdriba'},
  'freezing-rain': {label: 'Lijundra'},
  'hail': {label: 'Kruša'},
  'light-snow': {label: 'Nedidelis sniegas'},
  'snow': {label: 'Sniegas'},
  'heavy-snow': {label: 'Smarkus sniegas'},
  'snow-showers': {label: 'Trumpas sniegas'},
  'snow-at-times': {label: 'Protarpiais sniegas'},
  'light-snow-at-times': {label: 'Protarpiais nedidelis sniegas'},
  'snowstorm': {label: 'Pūga'},
  'mist': {label: 'Rūkana'},
  'fog': {label: 'Rūkas'},
  'squall': {label: 'Škvalas'},
};

// Condition icons that have day/night variants
const night_icons = [
  'clear',
  'cloudy-with-sunny-intervals',
  'partly-cloudy',
];

zingchart.i18n.lt = {
  ...zingchart.i18n.en_us,
  'decimals-separator': ',',
  'days-short' : ['Sek', 'Pir', 'Ant', 'Tre', 'Ket', 'Pen', 'Šeš'],
  'days-long' : ['Sekmadienis', 'Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis'],
  'months-short' : ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Gru'],
  'months-long' : ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'],
};

function renderChart(data) {
  const blue = getThemeColor('link');
  const red = getThemeColor('primary');
  const icon_scale_w = window.screen.width < 2100
    ? window.screen.width / 2100
    : 1;
  const icon_scale_h = window.screen.height < 1080
    ? Math.max(720, window.screen.height) / 1080
    : 1;
  const icon_scale = Math.min(icon_scale_w, icon_scale_h);
  
  let temperature = [];
  let wind = [];
  let wind_gust = [];
  let wind_arrows = {};
  let precip = [];
  let day_markers = [];
  let cloud_cover = [];
  let humidity = [];
  let pressure = [];
  let min_ts, max_ts;
  let temp_peaks = [];
  let current_condition;
  let prev_day = null;
  let prev_ts = null;
  let condition_series = Object.keys(condition_codes)
    .reduce((p,c) => {
      p[c] = [];
      if (night_icons.includes(c)) {
        p[c+'-night'] = [];
      }
      return p;
    }, {});
  coords = {
    lat: data.place.coordinates.latitude,
    lng: data.place.coordinates.longitude,
  };

  setUpdatedAt(new Date(data.forecastCreationTimeUtc + 'Z'));
  
  // Populate data series
  data.forecastTimestamps.forEach((item, i) => {
    let date = new Date(item.forecastTimeUtc + 'Z');
    let day = date.getDate();
    let timestamp = +date;
    
    temperature.push([timestamp, item.airTemperature]);
    wind.push(       [timestamp, item.windSpeed]);
    wind_gust.push(  [timestamp, item.windGust]);
    precip.push(     [timestamp, item.totalPrecipitation]);
    cloud_cover.push([timestamp, item.cloudCover]);
    humidity.push(   [timestamp, item.relativeHumidity]);
    pressure.push(   [timestamp, item.seaLevelPressure]);
    
    // Each wind direction is a separate data series with its own marker icon
    if (!wind_arrows[item.windDirection]) {
      wind_arrows[item.windDirection] = [];
    }
    wind_arrows[item.windDirection].push([timestamp, item.windSpeed]);

    // Each condition is a separate data series with its own marker icon
    let condition = night_icons.includes(item.conditionCode) && isNight(date, coords)
      ? item.conditionCode + '-night'
      : item.conditionCode;
    let stagger = prev_ts && (timestamp - prev_ts) <= 3.6e6;
    if (condition && condition_series[condition]) {
      condition_series[condition].push([timestamp, 1 + (stagger ? (i % 2) : 0)]);
      if (!current_condition
        && (timestamp > +new Date
          || i == data.forecastTimestamps.length - 1
        )
      ) {
        current_condition = condition;
      }
    }

    if (day != prev_day) {
      setDayMarkers(date);
    }

    prev_day = day;
    prev_ts = timestamp;
    if (!min_ts) min_ts = timestamp;
    max_ts = timestamp;
  });

  let next_day = new Date(max_ts);
  next_day.setDate(next_day.getDate() + 1);
  setDayMarkers(next_day);

  function setDayMarkers(date) {
    // Midnight marker
    day_markers.push({
      type: "line",
      range: [date.setHours(0,0,0,0)],
      valueRange: true,
      lineColor: '#cccccc',
      lineWidth: 2,
    });

    // Noon marker
    day_markers.push({
      type: "line",
      range: [date.setHours(12,0,0,0)],
      valueRange: true,
      lineColor: 'white',
      lineWidth: 2,
    });

    // Night range marker based on calculated sunset & sunrise times
    let sunrise = +SunriseSunsetJS.getSunrise(coords.lat, coords.lng, date);
    let prev_date = new Date(+date);
    prev_date.setDate(date.getDate() - 1);
    let prev_sunset = +SunriseSunsetJS.getSunset(coords.lat, coords.lng, prev_date);
    day_markers.push({
      type: 'area',
      range: [prev_sunset, sunrise],
      valueRange: true,
      backgroundColor: '#431043',
      alpha: .10,
      zIndex: -10,
    });
  }

  if (current_condition) {
    setCurrentCondition(current_condition);
  }

  // Current time marker
  day_markers.push({
    type: "line",
    range: [+new Date],
    valueRange: true,
    lineColor: 'yellow',
    lineWidth: 3,
    alpha: .5,
  });

  temp_peaks = detectPeaks(temperature, 1);

  chart_template.scaleX.markers = day_markers;
  chart_template.scaleX.minValue = min_ts;
  chart_template.scaleX.maxValue = max_ts;

  let conditions = Object.keys(condition_series)
    .map(code => {
      if (condition_series[code].length == 0) return null;
      let base_code = code.replace(/-night$/, '');
      let label = condition_codes[base_code].label;
      return {
        type: 'scatter',
        values: condition_series[code],
        text: label,
        guideLabel: {
          text: '<b>' + label + '</b>',
        },
        marker: {
          backgroundImage: 'icons/'+code+'.png',
          backgroundColor: "none",
          borderColor: "none",
          backgroundRepeat: "no-repeat",
          size: 24,
          backgroundScale: icon_scale,
          visible: true,
        },
        scales: 'scale-x,scale-y-2',
      };
    })
    .filter(e => e !== null);

  let temp_chart = mergeDeep(
    chart_template,
    {
      type: 'mixed',
      height: '34%',
      y: '0%',
      plotarea: {
        marginTop: 14,
      },
      scaleY: {
        label: {
          text: 'Temperatūra (°C)',
        },
        offsetStart: '15%',
      },
      scaleY2: {
        minValue: 0.5,
        maxValue: 2.5,
        visible: false,
        blended: true,
        offsetEnd: '85%',
      },
      series: [
        {
          type: 'area',
          aspect: 'spline',
          monotone: true,
          values: temperature,
          text: 'Temperatūra (°C)',
          scales: 'scale-x,scale-y',
          lineColor: red,
          backgroundColor: red,
          rules: [
            {
              rule: '%plot-0-value <= 0',
              lineColor: blue,
              backgroundColor: blue,
            },
          ],
          marker: {
            backgroundColor: red,
            rules: [
              {
                rule: '%plot-0-value <= 0',
                backgroundColor: blue,
              },
            ],
          },
          valueBox: {
            visible: false,
            overlap: false,
            rules: [
              {
                rule: '%plot-1-value > 0',
                visible: true,
                backgroundColor: 'white',
                shadow: false,
                borderRadius: 2,
              },
            ],
          },
        },
        {
          type: 'scatter',
          values: temp_peaks,
          visible: false,
        },
      ].concat(conditions),
    }
  );

  let wind_arrow_series = Object.keys(wind_arrows)
    .map(direction => {
      let angle = parseInt(direction)+180 % 360;
      return {
        type: 'scatter',
        values: wind_arrows[direction],
        clustered: false,
        marker: {
          type: 'triangle',
          size: Math.max(4, 8 * icon_scale),
          angle: angle,
          backgroundColor1: blue,
          backgroundColor2: '#f5f5f5',
        },
        guideLabel: {
          text: "<b>Vėjo kryptis:</b> "+compass(direction),
        },
      };
    });

  let wind_chart = mergeDeep(
    chart_template,
    {
      type: 'mixed',
      y: '56%',
      scaleY: {
        label: {
          text: "Vėjo greitis (m/s)",
        },
      },
      series: [
        {
          type: 'line',
          aspect: 'spline',
          monotone: true,
          values: wind,
          text: "Vėjo greitis (m/s)",
          marker: {
            visible: false,
          },
          lineColor: blue,
        },
        {
          type: 'line',
          aspect: 'spline',
          monotone: true,
          values: wind_gust,
          text: "Vėjo gūsiai (m/s)",
          lineColor: red,
          marker: {
            backgroundColor: red,
            rules: [
              {
                rule: '%plot-0-value == %plot-1-value',
                visible: false,
              },
            ],
          },
        },
      ].concat(wind_arrow_series),  
    }
  );

  let precip_max = Math.max(
    5,
    precip.reduce((p,c) => Math.max(p, c[1]), 0)
  );

  let precip_chart = mergeDeep(
    chart_template,
    {
      type: "mixed",
      y: '34%',
      plot: {
        groupBars: false,
      },
      scaleX: {
        offset: 0,        
      },
      scaleY: {
        label: {
          text: "Kritulių kiekis (mm)",
        },
        minValue: 0,
        maxValue: precip_max,
      },
      scaleY2: {
        visible: false,
        minValue: 0,
        maxValue: 100,
        guide: {
          visible: false,
        },
      },
      series: [
        {
          type: "bar",
          values: precip,
          text: 'Kritulių kiekis (mm)',
          scales: 'scale-x,scale-y',
          zIndex: 5,
          backgroundColor: blue,
        },
        {
          type: "area",
          aspect: "spline",
          monotone: true,
          lineWidth: 0,
          marker: {
            visible: false,
          },
          values: cloud_cover,
          text: 'Debesuotumas (%)',
          scales: 'scale-x,scale-y-2',
          lineColor: 'grey',
          backgroundColor: 'grey',
          alpha: .95,
          zIndex: 1,
        }
      ],
    }
  );

  let pressure_chart = mergeDeep(
    chart_template,
    {
      type: 'mixed',
      y: '78%',
      scaleY: {
        refValue: 1013.25,
        minValue: 'auto',
        label: {
          text: 'Slėgis (hPa)',
        },
      },
      scaleY2: {
        minValue: 0,
        maxValue: 100,
        label: {
          text: 'Santykinis drėgnis (%)',
        },
        visible: false,
      },
      series: [
        {
          type: 'line',
          aspect: 'spline',
          monotone: true,
          values: pressure,
          text: 'Slėgis (hPa)',
          scales: 'scale-x,scale-y',
          lineColor: red,
          marker: {
            backgroundColor: red,
          },
        },
        {
          type: 'area',
          aspect: 'spline',
          monotone: true,
          values: humidity,
          text: 'Santykinis drėgnis (%)',
          scales: 'scale-x,scale-y-2',
          marker: {
            visible: false,
          },
          lineWidth: 0,
          lineColor: blue,
          backgroundColor: blue,
        },
      ],
    }
  );
  
  zingchart.render({
    id: chart_id,
    height: '100%',
    locale: 'lt',
    data: {
      layout: "vertical",
      globals: {
        fontFamily: 'Asap',
      },
      graphset: [
        temp_chart,
        precip_chart,
        wind_chart,
        pressure_chart,
      ],
    },
  });
}

/**
 * Find local & daily maxima & minima in time series.
 */
function detectPeaks(series, threshold) {
  let output = [];
  if (threshold === undefined) {
    threshold = 0;
  }
  let day;
  let day_min;
  let day_min_i;
  let day_max;
  let day_max_i;
  let ref;
  let direction;
  series.forEach((point, i) => {
    let cur_day = new Date(point[0]).getDate();
    let val  = point[1];
    let next;

    if (cur_day != day) {
      if (day_min_i !== null) {
        output[day_min_i] = 1;
      }
      if (day_max_i !== null) {
        output[day_max_i] = 1;
      }
      day_min = null;
      day_min_i = null;
      day_max = null;
      day_max_i = null;
      day = cur_day;
    }

    if (day_min_i === null || day_min > val) {
      day_min = val;
      day_min_i = i;
    }

    if (day_max_i === null || day_max < val) {
      day_max = val;
      day_max_i = i;
    }

    if (series[i+1] === undefined) {
      next = val;
    } else {
      next = series[i+1][1];
    }

    if (ref === undefined) {
      output[i] = 0;
      ref = val;
      return;
    }

    let local_dir = val > next ? -1 : (val < next ? 1 : 0);
    if (direction === undefined) {
      if (local_dir !== 0) {
        direction = local_dir;
      }
      output[i] = 0;
      return;
    } else if (local_dir !== 0
      && direction != local_dir
    ) {
      if (Math.abs(ref - val) > threshold) {
        if (val == day_max) {
          day_max_i = i;
        }
        if (val == day_min) {
          day_min_i = i;
        }
        output[i] = 1;
      }
      direction = undefined;
      ref = val;
      return;
    } else {
      output[i] = 0;
      return;
    }
  });

  if (day_min_i !== null) {
    output[day_min_i] = 1;
  }
  if (day_max_i !== null) {
    output[day_max_i] = 1;
  }

  return output;
}

function initializePlaces(data) {
  var cities = [
    'vilnius',
    'kaunas',
    'klaipeda',
    'siauliai',
    'panevezys',
  ];
  var city_group = "Didmiesčiai";

  data.forEach(item => {
    places.push({
      value: item.code,
      label: item.name,
      group: item.administrativeDivision,
    });

    if (cities.includes(item.code)) {
      places.push({
        value: item.code,
        label: item.name,
        group: city_group,
      });
    }
  });

  //Sort by group, putting major cities on top
  places.sort((a, b) => {
    if (a.group === city_group) return -1;
    if (b.group === city_group) return  1;
    
    return a.group.localeCompare(b.group, "lt");
  });

  place_input.addEventListener(
    'focus',
    (event) => {
      let focus_value = place_input.value;
      let focus_place = place;
      place_input.value = '';

      place_input.addEventListener(
        'blur',
        (event) => {
          if (place_input.value === ''
            || place === focus_place
          ) {
            place_input.value = focus_value;
          }
        },
        {once: true}
      );
    }
  );

  // Initialize input autocomplete
  autocomplete({
    input: place_input,
    fetch: (text, update) => {
      text = text.toLowerCase();
      var suggestions = places.filter(n => {
        return n.value.includes(text)
          || n.label.toLowerCase().includes(text);
      })
      update(suggestions);
    },
    onSelect: item => {
      setPlace(item.value);
      place_input.blur();
    },
    showOnFocus: true,
  });

  updatePlaceLabel();
}

function initializeStations(data) {
  data.forEach(item => {
    stations.push({
      value: item.code,
      label: item.name,
    });
  });

  station_input.addEventListener(
    'focus',
    (event) => {
      let focus_value = station_input.value;
      let focus_station = station;
      station_input.value = '';

      station_input.addEventListener(
        'blur',
        (event) => {
          if (station_input.value === ''
            || station === focus_station
          ) {
            station_input.value = focus_value;
          }
        },
        {once: true}
      );
    }
  );

  // Initialize input autocomplete
  autocomplete({
    input: station_input,
    fetch: (text, update) => {
      text = text.toLowerCase();
      var suggestions = stations.filter(n => {
        return n.value.includes(text)
          || n.label.toLowerCase().includes(text);
      })
      update(suggestions);
    },
    onSelect: item => {
      setStation(item.value);
      station_input.blur();
    },
    showOnFocus: true,
  });

  updateStationLabel();
}

function isNight(date, coords) {
  return date < SunriseSunsetJS.getSunrise(coords.lat, coords.lng, date)
      || date > SunriseSunsetJS.getSunset (coords.lat, coords.lng, date);
}

function setMode(new_mode) {
  if (mode === new_mode || !modes.includes(new_mode)) return;

  mode = new_mode;

  let visible_id, hidden_id;

  if (mode === 'forecast') {
    visible_id = forecast_header_id;
    hidden_id = observations_header_id;
    if (!place) place = 'vilnius';
    setPlace(place);
  } else if (mode === 'observations') {
    visible_id = observations_header_id;
    hidden_id = forecast_header_id;
    if (!station) station = 'vilniaus-ams';
    setStation(station);
  }

  document.getElementById(hidden_id).style.display = 'none';
  let header = document.getElementById(visible_id);
  header.style.display = 'flex';
  document.querySelector('head title').innerText = header.querySelector('.page-title').innerText;
}

function setPlace(new_place) {
  setMode('forecast');

  place = new_place;
  fetchForecast();

  updatePlaceLabel();

  let url = new URL(document.location);
  url.hash = '#place:' + place;
  if (url.toString() !== document.location) {
    updateURL(url.toString());
  }
}

function setStation(new_station) {
  setMode('observations');

  station = new_station;
  fetchObservations();

  updateStationLabel();

  let url = new URL(document.location);
  url.hash = '#station:' + station;
  if (url.toString() !== document.location) {
    updateURL(url.toString());
  } 
}

function setUpdatedAt(date) {
  let updated_at = document.getElementById('updated-at');
  let next_update = document.getElementById('next-update');

  let updated_text = String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  updated_at.innerText = updated_text;

  let next_est = new Date(+date);
  next_est.setHours(next_est.getHours() + 3 + Math.round(next_est.getMinutes() / 60));
  let next_text = '~' + String(next_est.getHours()).padStart(2, '0') + ':00';
  next_update.innerText = next_text;
}

function setCurrentCondition(current_condition) {
  // Update favicon
  document.querySelector('link[rel="icon"]').href = "icons/" + current_condition + ".png";
}

function updatePlaceLabel() {
  let label = (places.find(i => i.value == place) || {}).label || place;
  place_input.value = label;
}

function updateStationLabel() {
  let label = (stations.find(i => i.value == station) || {}).label || station;
  station_input.value = label;
}

function updateURL(url) {
  history.replaceState({}, "", url);
}

function processURL(url) {
  let hash = decodeURIComponent(new URL(url).hash);
  if (!hash) return;
  let parts = hash.split(':');
  if (parts.length < 2) return;
  switch (parts[0]) {
    case "#place":
      setPlace(parts[1]);
    break;
    case "#station":
      setStation(parts[1]);
    break;
  }
}

function getThemeColor(name) {
  let style = window.getComputedStyle(document.querySelector(':root'));
  return style.getPropertyValue('--c-' + name).trim();
}

/**
 * Get compass direction label for azimuth angle.
 */
function compass(a) { 
  let r;
  let in_range = (a,min,max) => a >= min && a < max;
  switch (true) {
    case in_range(a,338,360):
    case in_range(a,  0, 23): r = 'Š';  break;
    case in_range(a, 23, 68): r = 'ŠR'; break;
    case in_range(a, 68,113): r = 'R';  break;
    case in_range(a,113,158): r = 'PR'; break;
    case in_range(a,158,203): r = 'P';  break;
    case in_range(a,203,248): r = 'PV'; break;
    case in_range(a,248,293): r = 'V';  break;
    case in_range(a,293,338): r = 'ŠV'; break;
  }
  return r + ', ' + a + '°'; 
}

/**
 * Transform observations data object to forecasts format.
 */
function observationsToForecasts(data) {
  data.place = data.station;
  data.forecastCreationTimeUtc = data.observations[data.observations.length - 1].observationTimeUtc;
  data.forecastTimestamps = data.observations.map((o) => {
    o.forecastTimeUtc = o.observationTimeUtc;
    o.totalPrecipitation = o.precipitation;
    return o;
  });
  return data;
}

async function fetchForecast() {
  // CORS proxy for https://api.meteo.lt/v1/places/{$place}/forecasts/long-term
  let url = 'https://skilful-tiger-414908.lm.r.appspot.com/meteo/forecast/' + place;

  return fetch(url, {cache: 'default'})
    .then(response => response.json())
    .then(data => renderChart(data))
    .catch((err) => {
      console.log(err);
      alert('Nepavyko gauti prognozės!');
    });
}

async function fetchObservations() {
  // CORS proxy for https://api.meteo.lt/v1/stations/{$station}/observations/{$date}
  let base_url = 'https://skilful-tiger-414908.lm.r.appspot.com/meteo/observations/' + station + '/';

  // Fetch 7 days of observations
  let date_promises = Array.from({length: 7}, (v,i) => {
    let d = new Date;
    d.setDate(d.getDate() - (6 - i));
    let date_string = d.toISOString().split('T')[0];
    return fetch(base_url + date_string, {cache: 'default'})
      .then(response => response.json());
  });

  return Promise.all(date_promises)
    .then(results => {
      let data;
      results.forEach(result => {
        if (data === undefined) {
          data = result;
        } else {
          data.observations = data.observations.concat(result.observations);
        }
      });
      renderChart(observationsToForecasts(data));
    })
    .catch((err) => {
      console.log(err);
      alert('Nepavyko gauti faktinių orų!');
    });
}

async function fetchPlaces() {
  // CORS proxy for https://api.meteo.lt/v1/places
  let url = 'https://skilful-tiger-414908.lm.r.appspot.com/meteo/places'; 

  return fetch(url, {cache: 'default'})
    .then(response => response.json())
    .then(data => initializePlaces(data))
    .catch((err) => {
      console.log(err);
      alert('Nepavyko gauti vietovių sąrašo!');
    });
}

async function fetchStations() {
  // CORS proxy for https://api.meteo.lt/v1/stations
  let url = 'https://skilful-tiger-414908.lm.r.appspot.com/meteo/stations';

  return fetch(url, {cache: 'default'})
    .then(response => response.json())
    .then(data => initializeStations(data))
    .catch((err) => {
      console.log(err);
      alert('Nepavyko gauti stočių sąrašo!');
    });
}

window.addEventListener('load', async (event) => {
  place_input = document.getElementById('place-input');
  station_input = document.getElementById('station-input');

  processURL(document.location);
  if (!place && !station) {
    setPlace("vilnius");
  }

  fetchPlaces();

  fetchStations();
});

window.addEventListener('hashchange', (event) => {
  processURL(document.location);
});

/**
 * From https://stackoverflow.com/a/37164538 by CpILL
 */
function mergeDeep(target, source) {
  let isObject = item => (item && typeof item === 'object' && !Array.isArray(item));
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
