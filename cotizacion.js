// Quote form: client-side validation and submission to Web3Forms with fetch.
// Without JavaScript the form still posts to Web3Forms, which redirects to the thanks page.
(function () {
  "use strict";
  const form = document.getElementById("cotizacion");
  if (!form) return;
  // The HTML keeps native validation for visitors without JavaScript; this script validates instead.
  form.noValidate = true;
  const TIMEOUT_MS = 15000;
  const lang = form.dataset.lang === "en" ? "en" : "es";
  const MSG = {
    es: {
      required: "Este campo es obligatorio.",
      email: "Escribe un correo válido, por ejemplo nombre@empresa.com.",
      choose: "Elige una opción.",
      short: "Cuéntame un poco más: al menos 20 caracteres.",
      consent: "Necesito tu autorización para tratar tus datos.",
      fix: "Revisa los campos marcados.",
      sending: "Enviando…",
      fail: "No se pudo enviar. Intenta de nuevo o escríbeme a info@jochiduarte.com.co.",
      timeout: "El envío tardó demasiado. Revisa tu conexión e intenta de nuevo, o escríbeme a info@jochiduarte.com.co.",
    },
    en: {
      required: "This field is required.",
      email: "Enter a valid email, for example name@company.com.",
      choose: "Choose an option.",
      short: "Tell me a bit more: at least 20 characters.",
      consent: "I need your consent to process your data.",
      fix: "Please check the highlighted fields.",
      sending: "Sending…",
      fail: "It could not be sent. Try again or email me at info@jochiduarte.com.co.",
      timeout: "Sending took too long. Check your connection and try again, or email me at info@jochiduarte.com.co.",
    },
  }[lang];
  const status = form.querySelector(".estado");
  const button = form.querySelector('button[type="submit"]');
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function problem(el) {
    if (el.type === "radio") {
      return form.querySelector('input[name="' + el.name + '"]:checked') ? "" : MSG.choose;
    }
    if (el.type === "checkbox") return el.checked ? "" : MSG.consent;
    const v = el.value.trim();
    if (!v) return el.tagName === "SELECT" ? MSG.choose : MSG.required;
    if (el.type === "email" && !EMAIL.test(v)) return MSG.email;
    if (el.minLength > 0 && v.length < el.minLength) return MSG.short;
    return "";
  }

  function errorBox(el) {
    const id = el.type === "radio" ? "f-tipo-error" : el.getAttribute("aria-describedby");
    return id ? document.getElementById(id) : null;
  }

  function show(el, text) {
    const box = errorBox(el);
    const group = el.type === "radio" ? form.querySelectorAll('input[name="' + el.name + '"]') : [el];
    group.forEach(function (x) { if (text) x.setAttribute("aria-invalid", "true"); else x.removeAttribute("aria-invalid"); });
    if (box) { box.textContent = text; box.hidden = !text; }
  }

  function fields() {
    const seen = {};
    return Array.prototype.filter.call(form.querySelectorAll("[required]"), function (el) {
      if (el.type !== "radio") return true;
      if (seen[el.name]) return false;
      seen[el.name] = true;
      return true;
    });
  }

  form.addEventListener("input", function (ev) {
    const el = ev.target;
    if (el.required && (el.getAttribute("aria-invalid") === "true" || el.type === "radio" || el.type === "checkbox")) show(el, problem(el));
  });
  form.addEventListener("change", function (ev) {
    const el = ev.target;
    if (el.required) show(el, problem(el));
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (button.disabled) return;
    if (form.botcheck && form.botcheck.checked) return; // honeypot: bots only
    let first = null;
    fields().forEach(function (el) {
      const p = problem(el);
      show(el, p);
      if (p && !first) first = el;
    });
    if (first) {
      status.textContent = MSG.fix;
      status.classList.add("mal");
      first.focus();
      return;
    }
    const data = {};
    new FormData(form).forEach(function (v, k) { if (k !== "redirect") data[k] = v; });
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    status.classList.remove("mal");
    status.textContent = MSG.sending;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    fetch(form.action, {
      method: "POST",
      signal: ctrl ? ctrl.signal : undefined,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (r) { return r.json().then(function (j) { return r.ok && j && j.success; }); })
      .then(function (ok) {
        clearTimeout(timer);
        if (!ok) throw new Error("rejected");
        window.location.assign(form.dataset.gracias);
      })
      .catch(function (err) {
        clearTimeout(timer);
        button.disabled = false;
        form.removeAttribute("aria-busy");
        status.textContent = err && err.name === "AbortError" ? MSG.timeout : MSG.fail;
        status.classList.add("mal");
      });
  });
})();
