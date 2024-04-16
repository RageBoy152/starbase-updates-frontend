import { deleteUpdate } from './script.js'
import { submitForm } from './script.js'
import { toggleEditUpdateUI } from './script.js'
import { copyLink } from './script.js'

// appends given update object to list as formatted html
export function appendUpdate(update,editedId) {
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

    // appends
    let updateElemInner = `
        <div class="row align-items-center justify-content-start gy-3 g-lg-0">
            <div class="col-1 col-lg-1 d-inline-flex justify-content-center me-2 me-lg-0">
                <img src="${pfpUrl}" alt="PFP" class="pfp rounded-circle bg-secondary ratio ratio-1x1">
            </div>
            <div class="col-1 d-inline-flex justify-content-start">
                <p class="my-auto uploader" id="${update.userId}">@${update.userName}</p>
            </div>
            <div class="col-1 col-lg-1 d-inline-flex justify-content-start justify-content-lg-center ms-auto">
                <div class="container dropdown-msg-options flex-row">
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
                <p class="my-auto ms-3">${update.userTimestamp.replace('T', '<span class="mx-2">|</span>')} <span class="ms-2 text-secondary" style="font-size:0.9em;cursor:default">UTC-6 (CT)</span></p>
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
    `

    if (editedId) {
        // if pin status changed or update has been edited, find the update object in the container and replace it's inner HTML
        let updateElemTemp = $(`#messagesContainer .update-${editedId}`)[0]
        updateElemTemp.setAttribute('data-timestamp', update.userTimestamp)
        updateElemTemp.setAttribute('data-location', update.location)
        updateElemTemp.setAttribute('data-vehicle', update.vehicle)
        updateElemTemp.setAttribute('data-body', update.body)
        updateElemTemp.setAttribute('data-pinned', update.pinned)
        updateElemTemp.setAttribute('data-userid', update.userId)
        updateElemTemp.setAttribute('data-edited', update.edited)

        updateElemTemp.innerHTML = updateElemInner
    }   else {
        let container = $('#messagesContainer')[0]
        container.innerHTML = `
            <div class="position-relative update-object container-fluid border-bottom border-top border-white p-4 update-${update._id}" data-timestamp="${update.userTimestamp}" data-location="${update.location}" data-vehicle="${update.vehicle}" data-body="${update.body}" data-pinned="${update.pinned}" data-userid="${update.userId}" data-edited=${update.edited} id="${update._id}">
                ${updateElemInner}
            </div>` 
            + $('#messagesContainer')[0].innerHTML
    }
    


}



// fetches all updates from backend on page laod and runs appendUpdate() foreach
fetch(`${backendAPIURL}get-updates`).then(async (res)=>{
    let updates = await res.json()

    // append updates to html
    for (let i=0;i<updates.length;i++) {
        appendUpdate(updates[i])
    }

    // add onclick events to deleteUpdate btns
    for (let i=0;i<$('#messagesContainer > div').length;i++) {
        let updateElem = $('#messagesContainer > div')[i]
        let updateId = updateElem.id
        
        $(`#messagesContainer > div .pin-update-btn`)[i].onclick = ()=>{submitForm({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "message": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid'),
            "pinned": updateElem.getAttribute('data-pinned')
        },true)}
        $(`#messagesContainer > div .delete-update-btn`)[i].onclick = ()=>{deleteUpdate(updateId)}
        $(`#messagesContainer > div .copy-update-link-btn`)[i].onclick = ()=>{copyLink(updateId, $(`#messagesContainer > div .copy-update-link-btn`)[i])}
        $(`#messagesContainer > div .edit-update-btn`)[i].onclick = ()=>{toggleEditUpdateUI({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "body": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid')
        })}


        if (updates[i].pinned == true && $(`#pinnedMsgsContainer .update-${updates[i]._id}`).length == 0) {
            updateId = updates[i]._id


            // if message is pinned, duplicate it into pinned messages list
            let updateClone = $(`main .update-${updates[i]._id}`).clone()
            $('#pinnedMsgsContainer').append(updateClone)

            updateElem = $(`#pinnedMsgsContainer .update-${updates[i]._id}`)[0]


            $(`#pinnedMsgsContainer .update-${updates[i]._id} .pin-update-btn`)[0].onclick = ()=>{submitForm({
                "updateId": updateId,
                "timestamp": updateElem.getAttribute('data-timestamp'),
                "location": updateElem.getAttribute('data-location'),
                "vehicle": updateElem.getAttribute('data-vehicle'),
                "message": updateElem.getAttribute('data-body'),
                "userId": updateElem.getAttribute('data-userid'),
                "pinned": updateElem.getAttribute('data-pinned')
            },true)}
            $(`#pinnedMsgsContainer .update-${updates[i]._id} .delete-update-btn`)[0].onclick = ()=>{deleteUpdate(updateId)}
            $(`#pinnedMsgsContainer .update-${updates[i]._id} .copy-update-link-btn`)[0].onclick = ()=>{copyLink(updateId, $(`#pinnedMsgsContainer .update-${updates[i]._id} .copy-update-link-btn`)[0])}
            $(`#pinnedMsgsContainer .update-${updates[i]._id} .edit-update-btn`)[0].onclick = ()=>{toggleEditUpdateUI({
                "updateId": updateId,
                "timestamp": updateElem.getAttribute('data-timestamp'),
                "location": updateElem.getAttribute('data-location'),
                "vehicle": updateElem.getAttribute('data-vehicle'),
                "body": updateElem.getAttribute('data-body'),
                "userId": updateElem.getAttribute('data-userid')
            })}
        }
    }


    // jump to message id if one was given
    checkForURLUpdateParam()

    // init tooltips
    initTooltips()

}).catch((err)=>{
    // issue with fetching all updates from backend
    console.log(err)
})