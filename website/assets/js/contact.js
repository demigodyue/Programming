/* Contact form — validates client-side, then submits to api/contact.php,
   which inserts the message into MySQL. The form is method="post" so that
   if this script ever fails to run, the browser falls back to a native
   POST instead of putting the visitor's name, email and phone in the URL. */

const contactForm = document.getElementById('contactForm')
const contactMsg = document.getElementById('contactMsg')
const contactSubmit = document.getElementById('contactSubmit')

let csrfToken = null

fetch('api/csrf.php', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(d => { csrfToken = d.token })
    .catch(() => { /* submit will surface the failure if this never arrives */ })

contactForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const first = contactForm.firstName.value.trim()
    const last = contactForm.lastName.value.trim()
    const email = contactForm.email.value.trim()
    const phone = contactForm.phone.value.trim()
    const interest = contactForm.interest.value
    const message = contactForm.message.value.trim()

    // validate before showing any loading state, and focus the offending field
    if (!first) {
        report(contactMsg, false, 'Please tell us your first name.')
        return contactForm.firstName.focus()
    }
    if (!isEmail(email)) {
        report(contactMsg, false, 'That email address does not look right — check for a typo.')
        return contactForm.email.focus()
    }
    if (!message) {
        report(contactMsg, false, 'Please add a short message so we know what to quote.')
        return contactForm.message.focus()
    }

    contactSubmit.classList.add('is-loading')
    contactSubmit.disabled = true

    fetch('api/contact.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ firstName: first, lastName: last, email, phone, interest, message })
    })
        .then(async (r) => ({ ok: r.ok, data: await r.json() }))
        .then(({ ok, data }) => {
            contactSubmit.classList.remove('is-loading')
            contactSubmit.disabled = false

            if (ok && data.ok) {
                report(contactMsg, true, data.message)
                contactForm.reset()
            } else {
                report(contactMsg, false, data.error || 'Something went wrong — please try again.')
            }
        })
        .catch(() => {
            contactSubmit.classList.remove('is-loading')
            contactSubmit.disabled = false
            report(contactMsg, false, 'Could not reach the server — check your connection and try again.')
        })
})
