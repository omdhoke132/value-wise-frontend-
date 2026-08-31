const API_BASE = window.VALUEWISE_API_URL || 'https://value-wise-backend.onrender.com';

const form = document.getElementById('recommenderForm');
const results = document.getElementById('results');
const state = document.getElementById('state');
const formError = document.getElementById('formError');
const resultCount = document.getElementById('resultCount');
const resultsTitle = document.getElementById('resultsTitle');
const weightStatus = document.getElementById('weightStatus');
const sliders = [...document.querySelectorAll('.slider-row input[type="range"]')];

function updateWeights() {
  const total = sliders.reduce((sum, input) => sum + Number(input.value), 0);
  sliders.forEach((input) => {
    const output = input.parentElement.querySelector('output');
    output.value = input.value;
  });
  const ratio = total ? Math.round((Number(document.querySelector('[data-key="value"]').value) / total) * 100) : 0;
  weightStatus.textContent = total === 100 ? 'Balanced' : `Custom · ${total}%`;
  weightStatus.title = `Value priority: ${ratio}% of your current weight mix`;
}

sliders.forEach((input) => input.addEventListener('input', updateWeights));
updateWeights();

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('budget').value = 30000;
  document.getElementById('minRam').value = 8;
  document.getElementById('minStorage').value = 128;
  document.getElementById('require5g').checked = true;
  document.getElementById('requireNfc').checked = false;
  const defaults = { gaming: 20, camera: 20, battery: 20, performance: 20, display: 10, value: 10 };
  sliders.forEach((input) => { input.value = defaults[input.dataset.key]; });
  updateWeights();
  formError.textContent = '';
});

function money(v) {
  if (v === null || v === undefined || v === '') return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v));
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
}

function phoneTitle(phone) {
  const brand = phone.brand || phone.manufacturer || '';
  const model = phone.model || phone.name || phone.phone_name || '';
  return [brand, model].filter(Boolean).join(' ') || 'Recommended phone';
}

function summary(phone) {
  const parts = [];
  if (phone.current_india_price) parts.push(money(phone.current_india_price));
  if (phone.ram) parts.push(`${phone.ram} GB RAM`);
  if (phone.storage_capacity) parts.push(`${phone.storage_capacity} GB storage`);
  if (phone.battery_capacity_m_ah) parts.push(`${phone.battery_capacity_m_ah} mAh`);
  return parts.join(' · ');
}

function reason(phone) {
  const bits = [];
  if (phone.benchmark_score) bits.push('strong performance');
  if (phone.ois) bits.push('OIS camera support');
  if (phone.five_g) bits.push('5G');
  if (phone.nfc) bits.push('NFC');
  if (phone.user_rating) bits.push(`${phone.user_rating}/5 user rating`);
  return bits.length ? `Why it ranks: ${bits.slice(0, 4).join(', ')}.` : 'Why it ranks: this model matched your filters and scored well against your priorities.';
}

function renderRecommendations(items) {
  results.innerHTML = items.map((phone, index) => `
    <article class="result-card">
      <div class="result-top">
        <div>
          <p class="phone-name">${index === 0 ? '🏆 ' : ''}${esc(phoneTitle(phone))}</p>
          <p class="phone-sub">${esc(summary(phone))}</p>
        </div>
        <div class="score">
          <strong>${Number(phone.valuewise_score || 0).toFixed(1)}</strong>
          <span>VALUE SCORE</span>
        </div>
      </div>
      <div class="meta-row">
        ${phone.main_camera ? `<span class="meta">${esc(phone.main_camera)}</span>` : ''}
        ${phone.refresh_rate ? `<span class="meta">${esc(phone.refresh_rate)} Hz</span>` : ''}
        ${phone.wired_charging_wattage ? `<span class="meta">${esc(phone.wired_charging_wattage)}W charging</span>` : ''}
        ${phone.five_g ? `<span class="meta">5G</span>` : ''}
      </div>
      <p class="reason">${esc(reason(phone))}</p>
    </article>
  `).join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';
  state.classList.add('hidden');
  results.classList.add('hidden');
  results.innerHTML = '';
  resultCount.textContent = '…';
  resultsTitle.textContent = 'Finding your matches…';

  const payload = {
    budget: Number(document.getElementById('budget').value),
    min_ram_gb: document.getElementById('minRam').value ? Number(document.getElementById('minRam').value) : null,
    min_storage_gb: document.getElementById('minStorage').value ? Number(document.getElementById('minStorage').value) : null,
    gaming: Number(document.querySelector('[data-key="gaming"]').value) / 100,
    camera: Number(document.querySelector('[data-key="camera"]').value) / 100,
    battery: Number(document.querySelector('[data-key="battery"]').value) / 100,
    performance: Number(document.querySelector('[data-key="performance"]').value) / 100,
    display: Number(document.querySelector('[data-key="display"]').value) / 100,
    value: Number(document.querySelector('[data-key="value"]').value) / 100,
    require_5g: document.getElementById('require5g').checked,
    require_nfc: document.getElementById('requireNfc').checked,
    limit: 8
  };

  if (!payload.budget || payload.budget <= 0) {
    formError.textContent = 'Enter a valid budget.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'The recommendation request failed.');

    resultsTitle.textContent = data.matches_found ? 'Your recommendations' : 'No exact matches';
    resultCount.textContent = `${data.matches_found || 0} match${data.matches_found === 1 ? '' : 'es'}`;

    if (!data.recommendations?.length) {
      state.classList.remove('hidden');
      state.innerHTML = '<div class="state-icon">⌁</div><h3>No phones matched everything.</h3><p>Try raising your budget or relaxing one of the minimum requirements.</p>';
      return;
    }

    renderRecommendations(data.recommendations);
    results.classList.remove('hidden');
  } catch (error) {
    resultsTitle.textContent = 'Couldn’t load recommendations';
    resultCount.textContent = 'Error';
    state.classList.remove('hidden');
    state.innerHTML = '<div class="state-icon">!</div><h3>Backend connection failed.</h3><p>Make sure the ValueWise API is deployed and reachable, then try again.</p>';
    formError.textContent = error.message;
  }
});
