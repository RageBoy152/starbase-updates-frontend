import { submitForm } from './script.js'
import { searchBarInput } from './script.js'


//  PREVENTS DEFAULT PAGE REFRESH ON MESSAGE INPUT FORM SUBMIT
$('#messageInput')[0].addEventListener('submit', event => {
    event.preventDefault()
    submitForm($('#messageInput')[0])
})


$('#messageInput #message')[0].addEventListener('keyup',e=>{
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        submitForm($('#messageInput')[0])
    }
})



$('.nav-search-input')[0].addEventListener('keydown',e=>{
    searchBarInput($('.nav-search-input')[0],e)
})


// searchBarInput(searchBar,e)