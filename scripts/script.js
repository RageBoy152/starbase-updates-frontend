// import io from 'socket.io-client'
import { appendUpdate } from './messages.js'

// const socket = io('http://localhost:3000')
const socket = io('https://starbase-updates-backend.onrender.com')

// socket io stuff
socket.on('connect', () => {
    console.log(`connected to server with id #${socket.id}`)

    // resfresh feed broadcast
    socket.on('refresh-feed',(newUpdate,editedUpdateId)=>{
        // console.log(newUpdate,editedUpdateId)
        if (editedUpdateId) {
            // edited update, find and remove original from html then proceed with regular adding
            $(`.update-${editedUpdateId}`).remove()
        }

        appendUpdate(newUpdate)

        // add onclick event to deleteUpdate btn
        let updateElem = $('#messagesContainer > div')[0]
        let updateId = updateElem.id
        $(`#messagesContainer > div .delete-update-btn`)[0].onclick = ()=>{deleteUpdate(updateId)}
        $(`#messagesContainer > div .edit-update-btn`)[0].onclick = ()=>{toggleEditUpdateUI({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "body": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid')
        })}
    })

    // delete update from feed broadcast
    socket.on('deleted-from-feed',(updateId)=>{
        $('#messagesContainer')[0].querySelector(`.update-${updateId}`).remove()
    })
})



// handles submition of update form
export function submitForm(form) {
    let formActionVerbForNotifications = 'adding'
    let formActionVerbForNotificationsAlt = 'post'
    let formActionVerbForNotificationsAlt2 = 'published'
    let updateId
    if ($('body')[0].classList.contains('editingUpdate')) {
        // editing update
        formActionVerbForNotifications = 'editing'
        formActionVerbForNotificationsAlt = 'edit'
        formActionVerbForNotificationsAlt2 = 'edited'
        updateId = form.getAttribute('data-edit-updateid')
    }



    //  check users login status
    getLoggedInInfo().then(async(res)=>{
        if (res.message=='401: Unauthorized') {
            notification([{
                "heading": `Error ${formActionVerbForNotifications} update`,
                "body": `You must be logged in to a discord account to ${formActionVerbForNotificationsAlt} updates. <a href=''>Login</a>`,
                "status": "danger"
            }])
            $('body')[0].classList.removed('logged-in')
            return
        }


        if (updateId) {
            //  check userauth res id against uploader id of update if editing
            let uploaderId = $(`#${updateId} .uploader`)[0].id
            if (!(uploaderId && uploaderId == res.id)) {
                //  user isn't the uploader of the update, no auth to delete
                notification([{
                    "heading": `Error editing update`,
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
        let timestamp = form.timestamp.value
        let u_location = form.u_location.value
        let vehicle = form.vehicle.value
        let message = form.message.value


        // input validation here
        if (timestamp === "" || u_location === "" || vehicle === "" || message === "") {
            notification([{
                "heading": "Error adding update",
                "body": "Invalid input",
                "status": "danger"
            }])
        } else {
            // input validation has been completed, clear to erase form inputs.
            form.timestamp.value = null
            form.u_location.value = ''
            form.vehicle.value = null
            form.message.value = null

            if (updateId) {toggleEditUpdateUI('hide')}


            // valid input, send fetch with queries to server to upload new update
            fetch(`${backendAPIURL}add-update?timestamp=${timestamp}&location=${u_location}&vehicle=${vehicle}&message=${message}&userId=${loggedInUserInfo.id}&userAvatar=${loggedInUserInfo.avatar}&userName=${loggedInUserInfo.username}&updateId=${updateId}`).then(async (res)=>{
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
    getLoggedInInfo().then((res)=>{
        if (res.message=='401: Unauthorized') {
            notification([{
                "heading": "Error deleting update",
                "body": "You must be logged in to a discord account to delete updates. <a href=''>Login</a>",
                "status": "danger"
            }])
            $('body')[0].classList.removed('logged-in')
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
    if (updateData.userId != loggedInUserInfo.id) {
        notification([{
            "heading": "Error editing update.",
            "body": "You can't edit an update that isn't yours.",
            "status": "danger"
        }])
        return
    }

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
        return
    }

    if (!$('body')[0].classList.contains('editingUpdate')) {
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
    form.message.value = updateData.body
    
    form.setAttribute('data-edit-updateId',updateData.updateId)
    
    jumpToMessage(updateData.updateId,1)
    toggleMsgBar()
}