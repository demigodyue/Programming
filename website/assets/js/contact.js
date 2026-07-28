/* Contact form — client-side validation only.
   There is no backend: nothing is transmitted or stored. The form is
   method="post" so that if this script ever fails to run, the browser
   falls back to a POST rather than putting the visitor's name, email
   and phone number into the URL. */

const contactForm = document.getElementById('contactForm')
const contactMsg = document.getElementById('contactMsg')
const contactSubmit = document.getElementById('contactSubmit')

contactForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const first = contactForm.firstName.value.trim()
    const email = contactForm.email.value.trim()
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

    withLoading(contactSubmit, 900, () => {
        report(contactMsg, true, `Dhanyabad, ${first}! Your message is on its way — we'll reply to ${email} within one working day.`)
        contactForm.reset()
    })
})
