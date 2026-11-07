const form = document.getElementById("cert-form");
const nameInput = document.getElementById("name");
const nameError = document.getElementById("name-error");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit");
const printBtn = document.getElementById("print");
const resetBtn = document.getElementById("reset");
const cert = document.getElementById("certyfikat");
const certArea = cert.closest(".cert-area");
const certName = document.getElementById("cert-name");
const certLevel = document.getElementById("cert-level");
const certDate = document.getElementById("cert-date");
const certNo = document.getElementById("cert-no");
const placeholder = document.getElementById("stamp-placeholder");
const statusEl = document.getElementById("status");

const SUBMIT_LABEL = submitBtn.textContent;
const PLACEHOLDER_LABEL = placeholder.textContent;
const NAME_PLACEHOLDER = "Twoje imię";
const PENDING = "po zatwierdzeniu";
// Krótka pauza na „sprawdzanie”: buduje moment przed przybiciem pieczątki.
const CHECK_MS = 1200;

let checkTimer = 0;

const steps = () => [...form.querySelectorAll('input[name="step"]')];

function renderPreview() {
  const name = nameInput.value.trim();
  certName.textContent = name || NAME_PLACEHOLDER;
  certName.toggleAttribute("data-empty", !name);
  certLevel.textContent = form.elements.level.value;
}

function setDraft(message) {
  clearTimeout(checkTimer);
  cert.dataset.state = "draft";
  certArea.removeAttribute("data-approved");
  certDate.textContent = PENDING;
  certNo.textContent = PENDING;
  placeholder.textContent = PLACEHOLDER_LABEL;
  submitBtn.disabled = false;
  submitBtn.textContent = SUBMIT_LABEL;
  printBtn.disabled = true;
  statusEl.textContent = message;
}

function clearErrors() {
  nameInput.removeAttribute("aria-invalid");
  nameError.hidden = true;
  formError.hidden = true;
  formError.textContent = "";
}

function certNumber(name, level, date) {
  let h = 5381;
  for (const ch of `${name}|${level}`) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `TM-${ymd}-${h.toString(36).slice(-4).toUpperCase().padStart(4, "0")}`;
}

function approve() {
  const now = new Date();
  const name = nameInput.value.trim();
  const level = form.elements.level.value;
  certDate.textContent = now.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  certNo.textContent = certNumber(name, level, now);
  cert.dataset.state = "approved";
  certArea.setAttribute("data-approved", "");
  submitBtn.textContent = "Zatwierdzone przez Wiksasa";
  printBtn.disabled = false;
  statusEl.textContent = `Zatwierdzone. Wiksas podpisał certyfikat dla: ${name}.`;

  const top = cert.getBoundingClientRect().top;
  if (top < 0 || top > window.innerHeight * 0.6) {
    cert.scrollIntoView({ block: "start" });
  }
}

form.addEventListener("input", () => {
  renderPreview();
  clearErrors();
  if (cert.dataset.state !== "draft") {
    setDraft("Dane się zmieniły, więc Wiksas musi zatwierdzić certyfikat jeszcze raz.");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (cert.dataset.state !== "draft") return;
  clearErrors();

  const name = nameInput.value.trim();
  const missing = steps().filter((s) => !s.checked);

  if (!name) {
    nameInput.setAttribute("aria-invalid", "true");
    nameError.hidden = false;
  }
  if (missing.length) {
    const list = missing.map((s) => s.dataset.short).join(", ");
    formError.textContent = `Wiksas nie podpisze. Brakuje: ${list}.`;
    formError.hidden = false;
  }
  if (!name) {
    nameInput.focus();
    statusEl.textContent = "Brakuje imienia, certyfikat czeka.";
    return;
  }
  if (missing.length) {
    missing[0].focus();
    statusEl.textContent = "Nie wszystkie kroki są zaznaczone, certyfikat czeka.";
    return;
  }

  cert.dataset.state = "checking";
  submitBtn.disabled = true;
  submitBtn.textContent = "Wiksas sprawdza…";
  placeholder.textContent = "Wiksas sprawdza przepis…";
  statusEl.textContent = "Wiksas sprawdza przepis…";
  checkTimer = setTimeout(approve, CHECK_MS);
});

printBtn.addEventListener("click", () => window.print());

resetBtn.addEventListener("click", () => {
  form.reset();
  clearErrors();
  renderPreview();
  setDraft("Certyfikat czeka na zatwierdzenie Wiksasa.");
  nameInput.focus();
});

renderPreview();
