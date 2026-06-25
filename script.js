const SELECTORS = {
  countdown: "[data-countdown]",
  ctaText: ".js-cta",
  stickyCta: "[data-sticky-cta]",
  slider: "[data-slider]",
  accordion: "[data-accordion]",
  form: "#lead-form",
  modal: "[data-modal]"
};

const TIMER_KEY = "primeinvestTimerStartedAt";
const TIMER_DURATION = 15 * 60 * 1000;
const PHONE_MASKS = {
  ua: { prefix: "+380", groups: [2, 3, 2, 2], placeholder: "+380 XX XXX XX XX" },
  pl: { prefix: "+48", groups: [3, 3, 3], placeholder: "+48 XXX XXX XXX" },
  us: { prefix: "+1", groups: [3, 3, 4], placeholder: "+1 XXX XXX XXXX" }
};

const formatTime = (milliseconds) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

const digitsOnly = (value) => value.replace(/\D/g, "");

const getRequiredPhoneLength = (country) => {
  const mask = PHONE_MASKS[country];
  return digitsOnly(mask.prefix).length + mask.groups.reduce((sum, group) => sum + group, 0);
};

function initCountdown() {
  const displays = document.querySelectorAll(SELECTORS.countdown);
  const ctaButtons = document.querySelectorAll(SELECTORS.ctaText);
  let startedAt = Number(sessionStorage.getItem(TIMER_KEY));

  if (!startedAt) {
    startedAt = Date.now();
    sessionStorage.setItem(TIMER_KEY, String(startedAt));
  }

  const tick = () => {
    const remaining = TIMER_DURATION - (Date.now() - startedAt);
    displays.forEach((display) => {
      display.textContent = formatTime(remaining);
    });

    if (remaining <= 0) {
      ctaButtons.forEach((button) => {
        button.textContent = "Последний шанс";
      });
      window.clearInterval(interval);
    }
  };

  const interval = window.setInterval(tick, 1000);
  tick();
}

function initStickyCta() {
  const sticky = document.querySelector(SELECTORS.stickyCta);
  if (!sticky) return;

  const update = () => {
    const visible = window.scrollY > window.innerHeight * 0.45;
    sticky.classList.toggle("is-visible", visible);
    sticky.setAttribute("aria-hidden", String(!visible));
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function initSlider() {
  const slider = document.querySelector(SELECTORS.slider);
  if (!slider) return;

  const track = slider.querySelector(".slider__track");
  const cards = Array.from(slider.querySelectorAll(".review-card"));
  const prev = slider.querySelector("[data-slider-prev]");
  const next = slider.querySelector("[data-slider-next]");
  const dotsRoot = slider.querySelector("[data-slider-dots]");
  let active = 0;
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  const visibleCards = () => (window.matchMedia("(min-width: 1024px)").matches ? 3 : 1);
  const maxIndex = () => Math.max(0, cards.length - visibleCards());

  function renderDots() {
    dotsRoot.replaceChildren();
    for (let index = 0; index <= maxIndex(); index += 1) {
      const dot = document.createElement("button");
      dot.className = "slider__dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Показать отзыв ${index + 1}`);
      dot.addEventListener("click", () => goTo(index));
      dotsRoot.append(dot);
    }
  }

  function goTo(index) {
    active = Math.min(Math.max(index, 0), maxIndex());
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = window.matchMedia("(min-width: 1024px)").matches ? 24 : 0;
    track.style.transform = `translateX(${-active * (cardWidth + gap)}px)`;
    dotsRoot.querySelectorAll(".slider__dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === active);
    });
  }

  const endDrag = () => {
    if (!isDragging) return;
    const delta = currentX - startX;
    if (Math.abs(delta) > 45) {
      goTo(delta < 0 ? active + 1 : active - 1);
    }
    isDragging = false;
  };

  prev.addEventListener("click", () => goTo(active - 1));
  next.addEventListener("click", () => goTo(active + 1));
  window.addEventListener("resize", () => {
    renderDots();
    goTo(active);
  });

  track.addEventListener("pointerdown", (event) => {
    isDragging = true;
    startX = event.clientX;
    currentX = startX;
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    currentX = event.clientX;
  });

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", () => {
    isDragging = false;
  });

  renderDots();
  goTo(0);
}

function setPanelHeight(panel, expand) {
  if (expand) {
    panel.hidden = false;
    panel.style.height = `${panel.scrollHeight}px`;
    return;
  }

  panel.style.height = `${panel.scrollHeight}px`;
  window.requestAnimationFrame(() => {
    panel.style.height = "0px";
  });
  window.setTimeout(() => {
    panel.hidden = true;
  }, 260);
}

function initAccordion() {
  const accordion = document.querySelector(SELECTORS.accordion);
  if (!accordion) return;

  const items = Array.from(accordion.querySelectorAll(".accordion__item"));

  items.forEach((item) => {
    const trigger = item.querySelector(".accordion__trigger");
    const panel = item.querySelector(".accordion__panel");

    if (trigger.getAttribute("aria-expanded") === "true") {
      panel.hidden = false;
      panel.style.height = `${panel.scrollHeight}px`;
    }

    trigger.addEventListener("click", () => {
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";

      items.forEach((entry) => {
        const entryTrigger = entry.querySelector(".accordion__trigger");
        const entryPanel = entry.querySelector(".accordion__panel");
        if (entryPanel === panel) return;
        entryTrigger.setAttribute("aria-expanded", "false");
        setPanelHeight(entryPanel, false);
      });

      trigger.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) {
        setPanelHeight(panel, true);
      } else {
        setPanelHeight(panel, false);
      }
    });
  });
}

function applyPhoneMask(input, country) {
  const mask = PHONE_MASKS[country];
  const raw = digitsOnly(input.value);
  const prefixDigits = digitsOnly(mask.prefix);
  let local = raw.startsWith(prefixDigits) ? raw.slice(prefixDigits.length) : raw;
  const maxLength = mask.groups.reduce((sum, group) => sum + group, 0);
  local = local.slice(0, maxLength);

  const parts = [];
  let cursor = 0;
  mask.groups.forEach((size) => {
    const part = local.slice(cursor, cursor + size);
    if (part) parts.push(part);
    cursor += size;
  });

  input.value = `${mask.prefix}${parts.length ? ` ${parts.join(" ")}` : " "}`;
}

function setError(field, message) {
  const wrapper = field.closest(".field");
  const error = wrapper?.querySelector(".field__error");
  wrapper?.classList.toggle("is-invalid", Boolean(message));
  if (error) error.textContent = message;
}

function validateStep(panel) {
  const fields = Array.from(panel.querySelectorAll("input[required]"));
  let valid = true;

  fields.forEach((field) => {
    let message = "";

    if (field.type === "checkbox") return;
    if (!field.value.trim()) message = "Заполните поле";
    if (!message && field.type === "email" && !field.validity.valid) message = "Введите корректный email";
    if (!message && field.name === "name" && field.value.trim().length < 2) message = "Введите минимум 2 символа";
    if (!message && field.name === "phone" && digitsOnly(field.value).length < getRequiredPhoneLength(panel.form.elements.country.value)) {
      message = "Введите полный номер телефона";
    }

    setError(field, message);
    if (message) valid = false;
  });

  return valid;
}

function initLeadForm() {
  const form = document.querySelector(SELECTORS.form);
  const modal = document.querySelector(SELECTORS.modal);
  if (!form || !modal) return;

  const panels = Array.from(form.querySelectorAll("[data-form-step]"));
  const indicators = Array.from(form.querySelectorAll("[data-step-indicator]"));
  const country = form.elements.country;
  const phone = form.elements.phone;
  const consent = form.elements.consent;
  const consentError = form.querySelector("[data-consent-error]");
  let step = 1;
  let lastFocusedElement = null;

  const showStep = (nextStep) => {
    step = nextStep;
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.formStep === String(step)));
    indicators.forEach((indicator) => indicator.classList.toggle("is-active", indicator.dataset.stepIndicator === String(step)));
  };

  const getModalFocusables = () => Array.from(modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
    .filter((element) => !element.disabled && element.offsetParent !== null);

  const openModal = () => {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    modal.querySelector(".modal__close").focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("is-modal-open");
    lastFocusedElement?.focus();
  };

  country.addEventListener("change", () => {
    phone.value = "";
    phone.placeholder = PHONE_MASKS[country.value].placeholder;
    setError(phone, "");
  });

  phone.addEventListener("focus", () => {
    if (!phone.value) applyPhoneMask(phone, country.value);
  });

  phone.addEventListener("input", () => applyPhoneMask(phone, country.value));

  form.querySelector("[data-next-step]").addEventListener("click", () => {
    if (validateStep(panels[0])) showStep(2);
  });

  form.querySelector("[data-prev-step]").addEventListener("click", () => showStep(1));

  form.addEventListener("input", (event) => {
    if (event.target.matches("input:not([type='checkbox'])")) {
      setError(event.target, "");
    }
    if (event.target === consent) {
      consentError.textContent = "";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const validFields = validateStep(panels[1]);
    const validConsent = consent.checked;
    consentError.textContent = validConsent ? "" : "Подтвердите согласие";

    if (!validFields || !validConsent) return;

    form.reset();
    phone.placeholder = PHONE_MASKS[country.value].placeholder;
    showStep(1);
    openModal();
  });

  modal.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;

    const focusableElements = getModalFocusables();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
}

initCountdown();
initStickyCta();
initSlider();
initAccordion();
initLeadForm();
