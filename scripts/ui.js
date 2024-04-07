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
$('body')[0].addEventListener('click',(e)=>{
    if (!e.target.classList.contains('bi-three-dots-vertical')) {
        dropdownMsgOptions = $('body')[0].querySelectorAll('.dropdown-msg-options')

        for (let i=0;i<dropdownMsgOptions.length;i++) {
            dropdownMsgOptions[i].classList.remove('show')
        }
    }
})



// delay function
const delay = ms => new Promise(res => setTimeout(res, ms));



//  JUMPS TO GIVEN MESSAGE ID
async function jumpToMessage(updateId,hold) {
    $(`.update-${updateId}`)[0].scrollIntoView()
    $(`.update-${updateId}`)[0].classList.add('active')

    // only remove active class if hold isn't specified
    if (!hold) {
        await delay(2000)
        $(`.update-${updateId}`)[0].classList.remove('active')
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