//          THIS SCRIPT HANDLES USER LOGIN, LOGOUT AND USERS DISCORD DATA          \\



//get logged in users info from discord
const fragment = new URLSearchParams(window.location.hash.slice(1));
const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

console.log(accessToken,tokenType)

loggedIn = false
let loggedInUserInfo



// check users login status on page load
if (accessToken&&tokenType) {
    loggedInUserInfo = getLoggedInInfo().then((res)=>{
        if (res.message=='401: Unauthorized') {loggedInUserInfo={};return}
    
        loggedIn = true
        $('body')[0].classList.add('logged-in')
        pfpUrl = `https://cdn.discordapp.com/avatars/${res.id}/${res.avatar}?size=1024`
        if (!res.avatar) {pfpUrl = `https://cdn.discordapp.com/embed/avatars/0.png`}
        $('#logInBtn')[0].innerHTML = `<a href=""><img src="${pfpUrl}" alt="PFP" class="pfp rounded-circle bg-secondary ratio ratio-1x1 me-2"> Logout</a>`
    })
}   else {
    loggedInUserInfo = {}
}



// get info of logged in user 
async function getLoggedInInfo() {
    if (accessToken) {
        const loggedInUserRes = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenType} ${accessToken}`,
            },
        })
        loggedInUserInfo = await loggedInUserRes.json()
        return loggedInUserInfo
    }
}



// validate a user is a registered contributor
async function getAuth(userId) {
    auth = fetch(`${backendAPIURL}check-dc-user?userId=${userId}`).then(async (res)=>{
        data = await res.json()
        if (data.dc_id == 0) {return false}
        else {return true}
    })
    return auth
}