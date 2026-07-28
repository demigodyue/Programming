/* Account page — signs in and creates accounts for real, against MySQL via
   api/signin.php and api/signup.php. Passwords are hashed server-side
   (password_hash/PASSWORD_DEFAULT) and never touch this file in any form
   but what the visitor just typed. Client-side checks below are only a
   convenience — the server re-validates everything independently. */

/* ---- tabs (keyboard accessible: arrow keys move between them) ---- */
const tabButtons = [...document.querySelectorAll('.tabs button')]
const panels = [...document.querySelectorAll('.auth-panel')]

function showTab(name, focusTab = false) {
    tabButtons.forEach(btn => {
        const selected = btn.dataset.tab === name
        btn.setAttribute('aria-selected', String(selected))
        btn.tabIndex = selected ? 0 : -1
        if (selected && focusTab) btn.focus()
    })
    panels.forEach(panel => { panel.hidden = panel.id !== name })
}

tabButtons.forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab)))

document.querySelector('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const current = tabButtons.findIndex(b => b.getAttribute('aria-selected') === 'true')
    const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length
    showTab(tabButtons[next].dataset.tab, true)
})

document.querySelectorAll('[data-goto]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault()
        showTab(link.dataset.goto, true)
    })
})

/* ---- password strength meter ---- */
const pwInput = document.getElementById('suPassword')
const pwMeter = document.getElementById('pwMeter')
const pwHint = document.getElementById('pwHint')
const PW_HINT_DEFAULT = 'Use 8+ characters with a number and a capital letter.'
const strengthText = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

function strengthOf(v) {
    if (v.length < 8) return 0
    let score = 1
    if (/[A-Z]/.test(v)) score++
    if (/\d/.test(v)) score++
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) score++
    return score
}

pwInput.addEventListener('input', () => {
    const score = strengthOf(pwInput.value)
    pwMeter.className = 'meter' + (score ? ' s' + score : '')
    pwHint.textContent = pwInput.value
        ? strengthText[score] + ' — ' + PW_HINT_DEFAULT.replace('Use ', 'use ')
        : PW_HINT_DEFAULT
})

/* ---- shared CSRF token, fetched once on page load ---- */
let csrfToken = null

fetch('api/csrf.php', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(d => { csrfToken = d.token })
    .catch(() => { /* submit will surface the failure if this never arrives */ })

function postJson(url, payload) {
    return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify(payload)
    }).then(async (r) => ({ ok: r.ok, data: await r.json() }))
}

/* ---- sign in ---- */
const signinForm = document.getElementById('signinForm')
const signinMsg = document.getElementById('signinMsg')
const signinSubmit = document.getElementById('signinSubmit')

signinForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const emailEl = document.getElementById('loginEmail')
    const passEl = document.getElementById('loginPassword')
    const rememberEl = document.getElementById('remember')

    if (!isEmail(emailEl.value.trim())) {
        report(signinMsg, false, 'Enter a valid email address.')
        return emailEl.focus()
    }
    if (passEl.value.length < 8) {
        report(signinMsg, false, 'Password must be at least 8 characters.')
        return passEl.focus()
    }

    signinSubmit.classList.add('is-loading')
    signinSubmit.disabled = true

    postJson('api/signin.php', {
        email: emailEl.value.trim(),
        password: passEl.value,
        remember: rememberEl.checked
    })
        .then(({ ok, data }) => {
            signinSubmit.classList.remove('is-loading')
            signinSubmit.disabled = false
            // never leave a password sitting in the DOM after a submit
            passEl.value = ''

            if (ok && data.ok) {
                report(signinMsg, true, data.message)
            } else {
                report(signinMsg, false, data.error || 'Something went wrong — please try again.')
            }
        })
        .catch(() => {
            signinSubmit.classList.remove('is-loading')
            signinSubmit.disabled = false
            passEl.value = ''
            report(signinMsg, false, 'Could not reach the server — check your connection and try again.')
        })
})

/* ---- sign up ---- */
const signupForm = document.getElementById('signupForm')
const signupMsg = document.getElementById('signupMsg')
const signupSubmit = document.getElementById('signupSubmit')

signupForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const first = document.getElementById('suFirst')
    const last = document.getElementById('suLast')
    const email = document.getElementById('suEmail')
    const country = document.getElementById('suCountry')
    const pass = document.getElementById('suPassword')
    const confirm = document.getElementById('suConfirm')
    const terms = document.getElementById('terms')

    if (!first.value.trim())          { report(signupMsg, false, 'Please enter your first name.'); return first.focus() }
    if (!last.value.trim())           { report(signupMsg, false, 'Please enter your last name.'); return last.focus() }
    if (!isEmail(email.value.trim())) { report(signupMsg, false, 'Enter a valid email address.'); return email.focus() }
    if (pass.value.length < 8)        { report(signupMsg, false, 'Password must be at least 8 characters.'); return pass.focus() }
    if (pass.value !== confirm.value) { report(signupMsg, false, 'The two passwords do not match.'); return confirm.focus() }
    if (!terms.checked)               { report(signupMsg, false, 'Please accept the terms of booking to continue.'); return terms.focus() }

    signupSubmit.classList.add('is-loading')
    signupSubmit.disabled = true

    postJson('api/signup.php', {
        firstName: first.value.trim(),
        lastName: last.value.trim(),
        email: email.value.trim(),
        country: country.value,
        password: pass.value,
        confirm: confirm.value,
        terms: terms.checked
    })
        .then(({ ok, data }) => {
            signupSubmit.classList.remove('is-loading')
            signupSubmit.disabled = false
            pass.value = ''
            confirm.value = ''

            if (ok && data.ok) {
                report(signupMsg, true, data.message)
                signupForm.reset()
                pwMeter.className = 'meter'
                pwHint.textContent = PW_HINT_DEFAULT
            } else {
                report(signupMsg, false, data.error || 'Something went wrong — please try again.')
            }
        })
        .catch(() => {
            signupSubmit.classList.remove('is-loading')
            signupSubmit.disabled = false
            pass.value = ''
            confirm.value = ''
            report(signupMsg, false, 'Could not reach the server — check your connection and try again.')
        })
})
