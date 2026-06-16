// ── Configuration ──────────────────────────────────────────────
// Remplacez cette URL par l'URL de déploiement de votre Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpuYAAsUUQVCqnj3dEBR8Sf09UoGVDWJcb8HWEegvAGEIFY5NB2qtwiZxYHH0sWXAX/exec';

// ── État de l'application ───────────────────────────────────────
let selectedActivity = null;

// ── Navigation ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function selectActivity(type) {
  selectedActivity = type;

  const badge = document.getElementById('activity-badge');
  badge.textContent = type;
  badge.className = 'activity-badge ' + (type === 'Patrouille' ? 'patrol' : 'training');

  document.getElementById('matricule-input').value = '';
  hideError();
  showScreen('screen-matricule');

  // Focus automatique sur le champ (pratique sur desktop)
  setTimeout(() => document.getElementById('matricule-input').focus(), 100);
}

function goBack() {
  showScreen('screen-choice');
  selectedActivity = null;
}

function restart() {
  selectedActivity = null;
  showScreen('screen-choice');
}

// ── Validation & envoi ──────────────────────────────────────────
function submitActivity() {
  const raw = document.getElementById('matricule-input').value.trim();

  // Champ vide
  if (raw === '') {
    showError('Veuillez saisir votre matricule.');
    return;
  }

  const num = parseInt(raw, 10);

  // Hors plage 01-90
  if (isNaN(num) || num < 1 || num > 90) {
    showError('Matricule invalide. Saisissez un nombre entre 01 et 90.');
    return;
  }

  // Formatage sur 2 chiffres
  const matricule = String(num).padStart(2, '0');

  hideError();
  sendToSheets(matricule);
}

async function sendToSheets(matricule) {
  const now       = new Date();
  const date      = formatDate(now);
  const heure     = formatTime(now);
  const activite  = selectedActivity;

  showSpinner(true);

  const params = new URLSearchParams({ matricule, date, heure, activite });

  try {
    // Apps Script répond à un GET avec les paramètres dans l'URL
    const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      mode: 'no-cors',   // Apps Script ne renvoie pas de header CORS en GET simple
    });

    // no-cors → réponse opaque, on considère l'envoi réussi
    showSuccess(matricule, activite, date, heure);
  } catch (err) {
    showSpinner(false);
    showError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    console.error(err);
  }
}

// ── Écran succès ────────────────────────────────────────────────
function showSuccess(matricule, activite, date, heure) {
  showSpinner(false);

  document.getElementById('success-details').innerHTML =
    `<strong>Matricule :</strong> ${matricule}<br>
     <strong>Activité :</strong> ${activite}<br>
     <strong>Date :</strong> ${date}<br>
     <strong>Heure :</strong> ${heure}`;

  showScreen('screen-success');
}

// ── Helpers ─────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-msg').classList.add('hidden');
}

function showSpinner(visible) {
  document.getElementById('spinner').classList.toggle('hidden', !visible);
}

function formatDate(d) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(d) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Validation à la touche Entrée ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('matricule-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitActivity();
  });
});
