function $(s, el) { return (el || document).querySelector(s); }
function $all(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

function api(action, data) {
  // text/plain body avoids a CORS preflight, which Apps Script does not answer
  return fetch(CONFIG.API_URL, {
    method: 'POST',
    body: JSON.stringify(Object.assign({action: action}, data || {}))
  }).then(function (r) { return r.json(); });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
  });
}

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(String(r.result).split(',')[1]); };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { return null; }
}

function isMobile() {
  var ua = navigator.userAgent || '';
  var touchOnly = ('ontouchstart' in window) && !window.matchMedia('(pointer:fine)').matches;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || touchOnly || screen.width < 900;
}

// Renders a multiple-choice test into a container. Returns a function that reads the answers.
function renderTest(container, test, numberFrom) {
  var html = '';
  if (test.text) html += '<div class="reading no-select">' + test.text + '</div>';
  test.questions.forEach(function (q, i) {
    html += '<div class="q no-select"><div class="qn">' + (numberFrom + i) + '. ' + esc(q.q) + '</div>';
    q.o.forEach(function (o) {
      html += '<label class="opt"><input type="radio" name="' + test.id + '_' + q.id + '" value="' + o.id + '"><span>' + esc(o.t) + '</span></label>';
    });
    html += '</div>';
  });
  container.innerHTML = html;
  $all('.opt input', container).forEach(function (inp) {
    inp.addEventListener('change', function () {
      $all('input[name="' + inp.name + '"]', container).forEach(function (x) { x.closest('.opt').classList.toggle('sel', x.checked); });
    });
  });
  return function () {
    var a = {};
    test.questions.forEach(function (q) {
      var c = $('input[name="' + test.id + '_' + q.id + '"]:checked', container);
      if (c) a[q.id] = Number(c.value);
    });
    return a;
  };
}

// Countdown to an absolute time. Calls onEnd once.
function countdown(el, endTime, onEnd) {
  var done = false;
  function tick() {
    var left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    var m = Math.floor(left / 60), s = left % 60;
    el.textContent = 'Time left: ' + m + ':' + (s < 10 ? '0' : '') + s;
    el.classList.toggle('low', left <= 60);
    if (left <= 0 && !done) { done = true; clearInterval(iv); onEnd(); }
  }
  var iv = setInterval(tick, 500);
  tick();
  return function stop() { done = true; clearInterval(iv); };
}
