//  HANDLES TOGGLING MESSAGE INPUT SCREEN ON MOBILE
function toggleMsgBar(toggleBtn) {
    if (toggleBtn=='close') {
        $('#msgInputBar')[0].classList.remove('active')
        $('body')[0].style.overflow = 'auto'
    }   else {
        $('#msgInputBar')[0].classList.add('active')
        $('body')[0].style.overflow = 'hidden'
    }
}



//  TOGGLES DROPDOWN FOR MESSAGE OPTIONS
function toggleDropDown(dropDownToggler) {
    dropdownContent = dropDownToggler.parentNode.querySelector('.dropdown-msg-options')
    if (!dropdownContent.classList.contains('show')) {
        dropdownContent.classList.add('show')
    }   else {
        dropdownContent.classList.remove('show')   
    }
}



//  HIDES MESSAGE OPTIONS DROPDOWN IF CLICKED ANYWHERE ELSE ON BODY
$('body')[0].addEventListener('click',async(e)=>{
    if (!e.target.classList.contains('bi-three-dots-vertical')) {
        dropdownMsgOptions = $('body')[0].querySelectorAll('.dropdown-msg-options')

        if (e.target.classList.contains('copy-update-link-btn') || e.target.classList.contains('bi-link-45deg')) {
            // if clicked on copy link btn, wait 2 secs before auto collapsing dropdown
            await delay(2000)
        }

        for (let i=0;i<dropdownMsgOptions.length;i++) {
            dropdownMsgOptions[i].classList.remove('show')
        }
    }

    if ($('nav .searchBarCol .nav-search-input')[0].classList.contains('active') && !e.target.classList.contains('bi-search') && !e.target.classList.contains('nav-search-input') && !e.target.classList.contains('nav-search-span')) {
        if ($('nav .searchBarCol .nav-search-input')[0].value === '') {$('nav .searchBarCol .nav-search-input')[0].classList.remove('active')}
    }
})



// delay function
const delay = ms => new Promise(res => setTimeout(res, ms));



//  JUMPS TO GIVEN MESSAGE ID
async function jumpToMessage(updateId,hold) {
    $(`#messagesContainer .update-${updateId}`)[0].scrollIntoView()
    $(`#messagesContainer .update-${updateId}`)[0].classList.add('active')

    // only remove active class if hold isn't specified
    if (!hold) {
        await delay(2000)
        $(`#messagesContainer .update-${updateId}`)[0].classList.remove('active')
    }
}



//  SHOWS A NEW NOTIFICATION TOAST
function notification(notifications) {
    notificationContainer = $('#notification-toasts-container')[0]

    for (let i=0;i<notifications.length;i++) {
        // generate temp toastId with first 4 characters of heading and current time
        toastId = notifications[i].heading.slice(0,4) + new Date().getTime()
        statusIcon = '<i class="bi bi-info-circle me-2"></i>'
        if (notifications[i].status == 'danger') {statusIcon = '<i class="bi bi-exclamation-octagon me-2"></i>'}
        else if (notifications[i].status == 'success') {statusIcon = '<i class="bi bi-check2-circle me-2"></i>'}

        notificationContainer.innerHTML += `
        <div class="toast border border-${notifications[i].status}" role="alert" aria-live="assertive" aria-atomic="true" id="toast-${toastId}">
            <div class="toast-header">
                <strong class="me-auto">${statusIcon} ${notifications[i].heading}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                <p>${notifications[i].body}</p>
            </div>
        </div>
        `

        notiToastBootstrap = bootstrap.Toast.getOrCreateInstance($(`#toast-${toastId}`)[0])
        notiToastBootstrap.show()

        $(`#toast-${toastId}`)[0].addEventListener('hidden.bs.toast', () => {
            $(`#toast-${toastId}`).remove()
          })
    }
}

// notification([
//     {
//         "heading": "Toast heading",
//         "body": "Toast message text is here.",
//         "status": "success"
//     }
// ])



// check for update query in url
function checkForURLUpdateParam() {
    url = new URL(window.location)
    urlUpdate = url.searchParams.get('update')

    if (urlUpdate) {
        jumpToMessage(urlUpdate)
    }
}



// convert time string into x time ago
function timeStrToXYAgo(timeStr) {
    // get Z offset as timeStr is given in UTC+0
    let currentTime = new Date()
    let offsetMinutes = currentTime.getTimezoneOffset()

    let offsetHours = Math.floor(offsetMinutes / 60)



    // Convert the input string to a Date object
    const [datePart, timePart] = timeStr.split('Z')[0].split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    let [hour, minute, second] = timePart.split('.')[0].split(':').map(Number)
    hour = hour-offsetHours
    const dateObject = new Date(year, month - 1, day, hour, minute, second)

    // Calculate the time difference between the current time and the input date
    const timeDifference = currentTime - dateObject

    // Define time periods in milliseconds
    const periods = [
    { name: 'year', duration: 365 * 24 * 60 * 60 * 1000 },
    { name: 'month', duration: 30 * 24 * 60 * 60 * 1000 },
    { name: 'week', duration: 7 * 24 * 60 * 60 * 1000 },
    { name: 'day', duration: 24 * 60 * 60 * 1000 },
    { name: 'hour', duration: 60 * 60 * 1000 },
    { name: 'minute', duration: 60 * 1000 },
    { name: 'second', duration: 1000 },
    ]

    // Find the appropriate time period and create the message
    for (const period of periods) {
    const periodCount = Math.floor(timeDifference / period.duration)
    if (periodCount > 0) {
        if (periodCount === 1) {
        return `${periodCount} ${period.name} ago`
        } else {
        return `${periodCount} ${period.name}s ago`
        }
    }
    }

    // If none of the periods match, return "just now"
    return "just now"
}



window.setInterval(()=>{
    updateObjects = $('.update-object')

    for (let i=0;i<updateObjects.length;i++) {
        // loop for each update object
        uploadAndEditTimes = $('.update-object #upload-and-edit-times')[i]
        updateId = updateObjects[i].id

        createdAt = uploadAndEditTimes.getAttribute('data-created-at')
        editedAt = uploadAndEditTimes.getAttribute('data-edited-at')


        createdAtElem = $(`.update-${updateId} #time-since-upload-text`)[0]
        editedAtElem = $(`.update-${updateId} #edited-label`)[0]


        if (editedAtElem) {
            editedAtElem.innerText = `Edited ${timeStrToXYAgo(editedAt)}`
        }
        createdAtElem.innerText = timeStrToXYAgo(createdAt)
    }
},60000)



//  initializes boostrap tooltips, to be called before and after feed load
function initTooltips() {
    $('[data-toggle="tooltip"], .tooltip').hide()
    
    toolTips = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    tooltipList = [...toolTips].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}



//  toggles search bar on mobile
function toggleSearchBarMobile() {
    searchBarInputElem = $('.nav-search-input')[0]
    if (searchBarInputElem.classList.contains('active')) {
        searchBarInputElem.classList.remove('active')
    }   else {
        searchBarInputElem.classList.add('active')
    }
}



function closeSearchResults() {
    // hide canvas
    searchResultsOffCanvas = bootstrap.Offcanvas.getInstance('#searchResults')
    searchResultsOffCanvas.hide()
    initTooltips()

    $('#searchResultsContainer')[0].innerHTML = ''
    searchResultsTitle = $('#searchResultsTitle')[0].innerText = `Search Results`
    $('.nav-search-input')[0].value = ''
    $('.nav-search-input')[0].classList.remove('active')
}