/* Account page — front-end demo only.

   There is NO authentication here: nothing is sent, verified or stored,
   and no credential ever leaves the page. Do not put this in front of
   real users as-is. Wiring it up for real means, at minimum:
     - serving over HTTPS
     - a server-side session or token, set as an HttpOnly Secure cookie
     - password hashing (argon2id / bcrypt) server-side
     - rate limiting and CSRF protection on the POST endpoint
   The forms are method="post" so a script failure can never place a
   password into the URL, history or server access logs. */

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

/* ---- sign in ---- */
const signinForm = document.getElementById('signinForm')
const signinMsg = document.getElementById('signinMsg')
const signinSubmit = document.getElementById('signinSubmit')

signinForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const emailEl = document.getElementById('loginEmail')
    const passEl = document.getElementById('loginPassword')

    if (!isEmail(emailEl.value.trim())) {
        report(signinMsg, false, 'Enter a valid email address.')
        return emailEl.focus()
    }
    if (passEl.value.length < 8) {
        report(signinMsg, false, 'Password must be at least 8 characters.')
        return passEl.focus()
    }

    withLoading(signinSubmit, 900, () => {
        report(signinMsg, true, `Namaste! Signed in as ${emailEl.value.trim()}. This is a front-end demo — connect a backend to make it real.`)
        // never leave a password sitting in the DOM after a submit
        passEl.value = ''
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
    const pass = document.getElementById('suPassword')
    const confirm = document.getElementById('suConfirm')
    const terms = document.getElementById('terms')

    if (!first.value.trim())          { report(signupMsg, false, 'Please enter your first name.'); return first.focus() }
    if (!last.value.trim())           { report(signupMsg, false, 'Please enter your last name.'); return last.focus() }
    if (!isEmail(email.value.trim())) { report(signupMsg, false, 'Enter a valid email address.'); return email.focus() }
    if (pass.value.length < 8)        { report(signupMsg, false, 'Password must be at least 8 characters.'); return pass.focus() }
    if (pass.value !== confirm.value) { report(signupMsg, false, 'The two passwords do not match.'); return confirm.focus() }
    if (!terms.checked)               { report(signupMsg, false, 'Please accept the terms of booking to continue.'); return terms.focus() }

    const name = first.value.trim()
    withLoading(signupSubmit, 1100, () => {
        report(signupMsg, true, `Welcome, ${name}! Your account is ready. This is a front-end demo — no data is stored.`)
        signupForm.reset()
        pwMeter.className = 'meter'
        pwHint.textContent = PW_HINT_DEFAULT
    })
})
