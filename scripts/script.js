// import io from 'socket.io-client'
import { appendUpdate } from './messages.js'

// const socket = io('http://localhost:3000')
const socket = io('https://starbase-updates-backend.onrender.com')

// socket io stuff
socket.on('connect', () => {
    console.log(`connected to server with id #${socket.id}`)

    // resfresh feed broadcast
    socket.on('refresh-feed',(newUpdate,editedUpdateId,pinnedChangeTxt)=>{

        if (editedUpdateId) {
            // edited update, find and remove original from html then proceed with regular adding
            // $(`#messagesContainer .update-${editedUpdateId}`).remove()
            if ((!newUpdate.pinned&&pinnedChangeTxt=='') || (newUpdate.pinned&&pinnedChangeTxt=='nope')) {$(`#pinnedMsgsContainer .update-${editedUpdateId}`).remove();if (pinnedChangeTxt=='nope') {pinnedChangeTxt='set pinned status to true'}}
        }

        appendUpdate(newUpdate,editedUpdateId)

        // add onclick event to dropdowns btn
        let updateElem = $('#messagesContainer > div')[0]
        let updateId = updateElem.id

        if (editedUpdateId) {
            updateElem = $(`main .update-${editedUpdateId}`)[0]
            updateId = editedUpdateId
        }
        

        $(`#messagesContainer > div .pin-update-btn`)[0].onclick = ()=>{submitForm({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "message": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid'),
            "pinned": updateElem.getAttribute('data-pinned')
        },true)}
        $(`#messagesContainer > div .delete-update-btn`)[0].onclick = ()=>{deleteUpdate(updateId)}
        $(`#messagesContainer > div .edit-update-btn`)[0].onclick = ()=>{toggleEditUpdateUI({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "body": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid')
        })}


        //  add dropdown functionality to pinned msgs
        if (pinnedChangeTxt == 'set pinned status to true' && $(`#pinnedMsgsContainer .update-${editedUpdateId}`).length == 0) {

            // if message is pinned, duplicate it into pinned messages list
            let updateClone = $(`main .update-${editedUpdateId}`).clone()
            $('#pinnedMsgsContainer').append(updateClone)

            updateElem = $(`#pinnedMsgsContainer .update-${editedUpdateId}`)[0]


            $(`#pinnedMsgsContainer .update-${editedUpdateId} .pin-update-btn`)[0].onclick = ()=>{submitForm({
                "updateId": editedUpdateId,
                "timestamp": updateElem.getAttribute('data-timestamp'),
                "location": updateElem.getAttribute('data-location'),
                "vehicle": updateElem.getAttribute('data-vehicle'),
                "message": updateElem.getAttribute('data-body'),
                "userId": updateElem.getAttribute('data-userid'),
                "pinned": updateElem.getAttribute('data-pinned')
            },true)}
            $(`#pinnedMsgsContainer .update-${editedUpdateId} .delete-update-btn`)[0].onclick = ()=>{deleteUpdate(editedUpdateId)}
            $(`#pinnedMsgsContainer .update-${editedUpdateId} .edit-update-btn`)[0].onclick = ()=>{toggleEditUpdateUI({
                "updateId": editedUpdateId,
                "timestamp": updateElem.getAttribute('data-timestamp'),
                "location": updateElem.getAttribute('data-location'),
                "vehicle": updateElem.getAttribute('data-vehicle'),
                "body": updateElem.getAttribute('data-body'),
                "userId": updateElem.getAttribute('data-userid')
            })}
        }

        initTooltips()
    })

    // delete update from feed broadcast
    socket.on('deleted-from-feed',(updateId)=>{
        $('#messagesContainer')[0].querySelector(`.update-${updateId}`).remove()
    })
})



// handles submition of update form
export function submitForm(form,pin) {
    let formActionVerbForNotifications = 'adding'
    let formActionVerbForNotificationsAlt = 'post'
    let formActionVerbForNotificationsAlt2 = 'published'
    let updateId
    let pinAction = false
    let isPinned = false
    let isEdited = false
 
    if (pin || $('body')[0].classList.contains('editingUpdate')) {
        // get updateId
        if ($('body')[0].classList.contains('editingUpdate')) {updateId = form.getAttribute('data-edit-updateid')}
        else if (pin) {updateId = form.updateId}

        // either pin action is called or editing an update, in which case get isEdited and isPinned
        isEdited = ($(`#messagesContainer > div.update-${updateId}`)[0].getAttribute('data-edited') === 'true')
        isPinned = ($(`#messagesContainer > div.update-${updateId}`)[0].getAttribute('data-pinned') === 'true')
    }

    if ($('body')[0].classList.contains('editingUpdate')) {
        // editing update
        formActionVerbForNotifications = 'editing'
        formActionVerbForNotificationsAlt = 'edit'
        formActionVerbForNotificationsAlt2 = 'edited'
    }   else if (pin) {
        formActionVerbForNotifications = 'pinning'
        formActionVerbForNotificationsAlt = 'pin'
        formActionVerbForNotificationsAlt2 = 'pinned'

        pinAction = true

        if (isPinned) {
            formActionVerbForNotifications = 'unpinning'
            formActionVerbForNotificationsAlt = 'unpin'
            formActionVerbForNotificationsAlt2 = 'unpinned'
        }
    }
    



    //  check users login status
    getLoggedInInfo().then(async(res)=>{
        if (res == undefined || res.message=='401: Unauthorized') {
            notification([{
                "heading": `Error ${formActionVerbForNotifications} update`,
                "body": `You must be logged in to a discord account to ${formActionVerbForNotificationsAlt} updates. <a href=''>Login</a>`,
                "status": "danger"
            }])
            $('body')[0].classList.remove('logged-in')
            return
        }


        if (updateId) {
            //  check userauth res id against uploader id of update if editing
            let uploaderId = $(`.update-${updateId} .uploader`)[0].id
            if (!(uploaderId && uploaderId == res.id)) {
                //  user isn't the uploader of the update, no auth to delete
                notification([{
                    "heading": `Error ${formActionVerbForNotifications} update`,
                    "body": "You can't do this.",
                    "status": "danger"
                }])
                return
            }
        }

        let userHasAuth = await getAuth(res.id)
        if (!userHasAuth) {
            // user does not have perms to add updates.
            notification([{
                "heading": `Error ${formActionVerbForNotifications} update`,
                "body": "You are not an authorised site contributor. Please dm @rage.boy on discord to find out how to become one.",
                "status": "danger"
            }])
            return
        }
        

        // auth is fine, continue with form processing
        let timestamp
        let u_location
        let vehicle
        let message
        if (!pinAction) {
            timestamp = form.timestamp.value
            u_location = form.u_location.value
            vehicle = form.vehicle.value
            message = form.message.value.replace(/(\r\n|\r|\n)/g, '<br>')
        }   else {
            timestamp = form.timestamp
            u_location = form.location
            vehicle = form.vehicle
            message = form.message
        }


        // input validation here
        if (timestamp === "" || u_location === "" || vehicle === "" || message === "") {
            notification([{
                "heading": "Error adding update",
                "body": "Invalid input",
                "status": "danger"
            }])
        } else {
            // input validation has been completed, clear to erase form inputs.
            if (!pinAction) {
                form.timestamp.value = null
                form.u_location.value = ''
                form.vehicle.value = null
                form.message.value = null
            }

            if (updateId && !pinAction) {toggleEditUpdateUI('hide')}


            // valid input, send fetch with queries to server to upload new update
            // res.id = '523327414026371082'
            // console.log(res.id)
            fetch(`${backendAPIURL}add-update?timestamp=${timestamp}&location=${u_location}&vehicle=${vehicle}&message=${message}&userId=${res.id}&userAvatar=${loggedInUserInfo.avatar}&userName=${loggedInUserInfo.username}&updateId=${updateId}&pinAction=${pinAction}&pinStatus=${isPinned}&prevEdits=${isEdited}`).then(async (res)=>{
                let resJson = await res.json()
                if (resJson.err) {
                    // issue with pushing update
                    notification([{
                        "heading": `Error ${formActionVerbForNotifications} update`,
                        "body": `An unexpected issue has occured ${formActionVerbForNotifications} your update: <br> ${resJson.err}`,
                        "status": "danger"
                    }])
                }
                else {
                    // update pushed
                    notification([{
                        "heading": `Update ${formActionVerbForNotificationsAlt2}!`,
                        "body": `Your update has been ${formActionVerbForNotificationsAlt}ed`,
                        "status": "success"
                    }])
                }
            })
        }
    })
}



// handles deleting update
export function deleteUpdate(updateId) {
    //  check users login status
    getLoggedInInfo().then(async (res)=>{
        if (res == undefined || res.message=='401: Unauthorized') {
            notification([{
                "heading": "Error deleting update",
                "body": "You must be logged in to a discord account to delete updates. <a href=''>Login</a>",
                "status": "danger"
            }])
            $('body')[0].classList.remove('logged-in')
            return
        }


        //  check userauth res id against uploader id of update
        let uploaderId = $(`#${updateId} .uploader`)[0].id
        if (!(uploaderId && uploaderId == res.id)) {
            //  user isn't the uploader of the update, no auth to delete
            notification([{
                "heading": "Error deleting update",
                "body": "You can't do this.",
                "status": "danger"
            }])
            return
        }        



        // valid input, send fetch with queries to server to upload new update
        fetch(`${backendAPIURL}delete-update?updateId=${updateId}`).then(async (res)=>{
            let resJson = await res.json()
            if (resJson.err) {
                // issue with deleting
                notification([{
                        "heading": "Error deleting update",
                        "body": `An unexpected issue has occured deleting update: <br> ${resJson.err}`,
                        "status": "danger"
                    }])
            }
            else {
                // update deleted
                notification([{
                    "heading": "Update deleted.",
                    "body": "The update has been deleted.",
                    "status": "success"
                }])
            }
        })
    })
}



//  HANDLES TOGGLING EDITING UPDATE FORM
export function toggleEditUpdateUI(updateData) {
    let form = $('#messageInput')[0]

    if (updateData == 'hide') {
        $('#messageInput #mobile-send-update-text')[0].innerText = 'Send update'
        $('#messageInput .bi-pencil-square')[0].classList.value = 'bi-send'

        $('#messagesContainer > div.active')[0].classList.remove('active')
        $('#messageInput #editingUpdateText')[0].classList.add('d-none')

        $('body')[0].classList.remove('editingUpdate')

        form.removeAttribute('data-edit-updateId')


        // form inputs
        form.timestamp.value = null
        form.vehicle.value = null
        form.u_location.value = ''
        form.message.value = null
        form.message.style.height = "";form.message.style.height = form.message.scrollHeight + "px"
        return
    }

    if (updateData.userId != loggedInUserInfo.id) {
        notification([{
            "heading": "Error editing update.",
            "body": "You can't edit an update that isn't yours.",
            "status": "danger"
        }])
        return
    }

    if (!$('body')[0].classList.contains('editingUpdate')) {
        $(`#messagesContainer .update-${updateData.updateId}`)[0].classList.add('active')
        $('#messageInput #mobile-send-update-text')[0].innerText = 'Edit update'
        $('#messageInput .bi-send')[0].classList.value = 'bi bi-pencil-square'
    
        $('body')[0].classList.add('editingUpdate')
        $('#messageInput #editingUpdateText')[0].classList.remove('d-none')
        
        $('#messageInput #closeEditBtn')[0].onclick = ()=>{toggleEditUpdateUI('hide')}
    }   else {
        $('#messagesContainer > div.active')[0].classList.remove('active')
    }


    let bodyTrimmed = updateData.body.slice(0,20)
    if (updateData.body.length>20) {bodyTrimmed = bodyTrimmed+'...'}

    $('#messageInput #editingUpdateText p')[0].innerText = `Editing update "${bodyTrimmed}"`


    // form inputs
    form.timestamp.value = updateData.timestamp
    form.vehicle.value = updateData.vehicle
    form.u_location.value = updateData.location
    form.message.value = updateData.body.replace(/<br>/g,'\n')
    form.message.style.height = "";form.message.style.height = form.message.scrollHeight + "px"
    
    form.setAttribute('data-edit-updateId',updateData.updateId)
    
    jumpToMessage(updateData.updateId,1)
    toggleMsgBar()
}




export async function copyLink(updateId, copyLinkBtnElem) {
    let url = new URL(window.location)
    url.searchParams.set('update',updateId)
    
    navigator.clipboard.writeText(url)


    let tooltipElem = bootstrap.Tooltip.getInstance(copyLinkBtnElem)
    

    copyLinkBtnElem.innerHTML = '<i class="bi bi-check2 ms-1"></i>'
    copyLinkBtnElem.classList.add('text-teal')
    tooltipElem.setContent({ '.tooltip-inner': 'Link Copied!' })
    
    await delay(2000)

    copyLinkBtnElem.innerHTML = '<i class="bi bi-link-45deg ms-1"></i>'
    copyLinkBtnElem.classList.remove('text-teal')
    tooltipElem.setContent({ '.tooltip-inner': 'Copy Link' })
}




export async function searchBarInput(searchBar,e) {
    
    if (e.key === 'Enter') {
        e.preventDefault()

        let searchQuery = searchBar.value

        // input validation
        if (searchQuery === '') {
            notification([
                {
                    "heading": "Search Failed",
                    "body": "Invalid input.",
                    "status": "danger"
                }
            ])
            return
        }


        fetch(`${backendAPIURL}search-updates?q=${searchQuery}`).then(async(res)=>{
            let searchResults = await res.json()
            let searchResultsBody = $('#searchResultsContainer')[0]

            // add title to canvas
            let resultText = 'results'
            if (searchResults.length==1) {resultText = 'result'}
            $('#searchResultsTitle')[0].innerText = `Showing ${searchResults.length} ${resultText} for '${searchBar.value}'`


            // add updates to canvas
            for (let i=0;i<searchResults.length;i++) {
                let update = searchResults[searchResults.length-(i+1)]

                // handles getting pfp url
                if (update.userId=='693191740961718400') {update.userId = '693191740961718420'}
                let pfpUrl = `https://cdn.discordapp.com/avatars/${update.userId}/${update.userAvatar}`
                if (!update.userAvatar || update.userAvatar == 'null') {pfpUrl = `https://cdn.discordapp.com/embed/avatars/0.png`}


                let pinIFill = ''
                let pinBtnMsg = 'Pin'
                if (update.pinned) {
                    pinIFill = '-fill'
                    pinBtnMsg = 'Unpin'
                }

                let editedLabel = ''
                if (update.edited) {editedLabel = `<span id="edited-label" class="ms-3" data-bs-toggle="tooltip" data-bs-title="${update.updatedAt.split('.')[0].replace('T',' @ ')} UTC">Edited ${timeStrToXYAgo(update.updatedAt)}</span>`}


                searchResultsBody.innerHTML += `
                    <div class="position-relative update-object container-fluid border-bottom border-top border-white p-4 update-${update._id}" data-timestamp="${update.userTimestamp}" data-location="${update.location}" data-vehicle="${update.vehicle}" data-body="${update.body}" data-pinned="${update.pinned}" data-userid="${update.userId}" data-edited=${update.edited} id="${update._id}">
                        <div class="row align-items-center justify-content-start gy-3 g-lg-0">
                        <div class="col-1 col-lg-1 d-inline-flex justify-content-center me-2 me-lg-0">
                            <img src="${pfpUrl}" alt="PFP" class="pfp rounded-circle bg-secondary ratio ratio-1x1">
                        </div>
                        <div class="col-1 d-inline-flex justify-content-start ms-2">
                            <p class="my-auto uploader" id="${update.userId}">@${update.userName}</p>
                        </div>
                        <div class="col-1 col-lg-1 d-inline-flex justify-content-start justify-content-lg-center ms-auto">
                            <div class="container dropdown-msg-options flex-row">
                                <div class="col">
                                    <p role="button" class="jump-to-btn mb-0 d-flex align-items-center justify-content-center" data-bs-toggle="tooltip" data-bs-title="Jump To"><i class="bi bi-box-arrow-in-up"></i></p>
                                </div>
                                <div class="col">
                                    <p role="button" class="copy-update-link-btn mb-0 d-flex align-items-center justify-content-center" data-bs-toggle="tooltip" data-bs-title="Copy Link"><i class="bi bi-link-45deg"></i></p>
                                </div>
                                <div class="col">
                                    <p role="button" class="pin-update-btn mb-0 d-flex align-items-center justify-content-center" data-bs-toggle="tooltip" data-bs-title="${pinBtnMsg} Update"><i class="bi bi-pin-angle${pinIFill}"></i></p>
                                </div>
                                <div class="col">
                                    <p role="button" class="edit-update-btn mb-0 d-flex align-items-center justify-content-center" data-bs-toggle="tooltip" data-bs-title="Edit"><i class="bi bi-pencil-fill"></i></p>
                                </div>
                                <div class="col">
                                    <p role="button" id="text-danger" class="delete-update-btn mb-0 text-danger d-flex align-items-center justify-content-center" data-bs-toggle="tooltip" data-bs-title="Delete"><i class="bi bi-trash3"></i></p>
                                </div>
                            </div>
                        </div>
                    </div>
            
                    <div class="row mt-3 px-xl-4 px-1 text-secondary">
                        <div class="col d-inline-flex justify-content-start px-xl-4 px-1" id="upload-and-edit-times" data-created-at="${update.createdAt}" data-edited-at="${update.updatedAt}">
                            <p class="my-auto"><span id="time-since-upload-text" data-bs-toggle="tooltip" data-bs-title="${update.createdAt.split('.')[0].replace('T',' @ ')} UTC">${timeStrToXYAgo(update.createdAt)}</span> ${editedLabel}</p>
                        </div>
                    </div>
            
                    <div class="row mt-3 px-xl-4 px-1">
                        <div class="col d-inline-flex justify-content-start px-xl-4 px-1">
                            <p class="my-auto">${update.body}</p>
                        </div>
                    </div>
            
                    <div class="row mt-3 px-xl-4 px-1 gy-1">
                        <div class="col-12 d-inline-flex justify-content-start px-xl-4 px-1">
                            <i class="bi bi-clock"></i>
                            <p class="my-auto ms-3">${update.userTimestamp.replace('T', '<span class="mx-2">|</span>')}</p>
                        </div>
                        <div class="col-12 d-inline-flex justify-content-start px-xl-4 px-1">
                            <i class="bi bi-rocket-takeoff"></i>
                            <p class="my-auto ms-3">${update.vehicle}</p>
                        </div>
                        <div class="col-12 d-inline-flex justify-content-start px-xl-4 px-1">
                            <i class="bi bi-geo-alt"></i>
                            <p class="my-auto ms-3">${update.location}</p>
                        </div>
                    </div>
                    </div>
                `
            }

            if (searchResults.length==0) {
                searchResultsBody.innerHTML += `<p>No results.</p>`
            }

            // add functionality to btns
            for (let i=0;i<$('#searchResultsContainer > div').length;i++) {
                let updateElem = $('#searchResultsContainer > div')[i]
                let updateId = updateElem.id
                $(`#searchResultsContainer > div .pin-update-btn`)[i].onclick = ()=>{submitForm({
                    "updateId": updateId,
                    "timestamp": updateElem.getAttribute('data-timestamp'),
                    "location": updateElem.getAttribute('data-location'),
                    "vehicle": updateElem.getAttribute('data-vehicle'),
                    "message": updateElem.getAttribute('data-body'),
                    "userId": updateElem.getAttribute('data-userid'),
                    "pinned": updateElem.getAttribute('data-pinned')
                },true)}
                $(`#searchResultsContainer > div .delete-update-btn`)[i].onclick = ()=>{deleteUpdate(updateId)}
                $(`#searchResultsContainer > div .copy-update-link-btn`)[i].onclick = ()=>{copyLink(updateId, $(`#searchResultsContainer > div .copy-update-link-btn`)[i])}
                $(`#searchResultsContainer > div .jump-to-btn`)[i].onclick = ()=>{closeSearchResults();jumpToMessage(updateId)}
                $(`#searchResultsContainer > div .edit-update-btn`)[i].onclick = ()=>{toggleEditUpdateUI({
                    "updateId": updateId,
                    "timestamp": updateElem.getAttribute('data-timestamp'),
                    "location": updateElem.getAttribute('data-location'),
                    "vehicle": updateElem.getAttribute('data-vehicle'),
                    "body": updateElem.getAttribute('data-body'),
                    "userId": updateElem.getAttribute('data-userid')
                })}
            }
            initTooltips()
                
            }).catch((err)=>{
                // issue with search fetch
                console.log(err)
                notification([
                    {
                        "heading": "Search Failed",
                        "body": err,
                        "status": "danger"
                    }
                ])
                return
            })

        // show canvas
        let searchResultsOffCanvas = new bootstrap.Offcanvas('#searchResults')
        searchResultsOffCanvas.show()
    }
}