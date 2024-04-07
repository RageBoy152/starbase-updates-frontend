import { submitForm } from './script.js'


//  PREVENTS DEFAULT PAGE REFRESH ON MESSAGE INPUT FORM SUBMIT
$('#messageInput')[0].addEventListener('submit', event => {
    event.preventDefault()
    submitForm($('#messageInput')[0])
})