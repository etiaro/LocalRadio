import React from 'react';
import ReactDOM from 'react-dom';
import Panel from './Panel';
import Login from './Login';
import Cookies from 'universal-cookie';


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
 }

const cookies = new Cookies();

const adress = "http://"+window.location.hostname+":80/api/";
var notificationID = makeid(8);

function getUserData(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"login/data/", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(null);
    return xmlHttp.responseText;
}//TODO getStatusData


function login(response){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"login", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.send("accessToken="+response.accessToken);
    if(xmlHttp.status === 200){
        cookies.set('accessToken',  JSON.parse(xmlHttp.responseText).token, { Expires: new Date(new Date().getTime()+3600000).toUTCString() });
        changePage();
        return true;
    }
    return false;
}

function downloadSong(ytUrl){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/download", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send('{"url": "'+ytUrl+'"}');
    return false;
}
function playSong(fileName, songName, length){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/play", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(JSON.stringify({fileName:fileName, songName:songName, length:length}));
    return false;
}
function switchShuffle(play){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/play", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    if(play)
        xmlHttp.send('{"shufflePlay": true}');
    else
        xmlHttp.send('{"shuffleSwitch": true}');
    return false;
}
function stopSong(fileName){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/stop", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(null);
    return false;
}
function findSong(songData){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/list", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(JSON.stringify(songData));
    return JSON.parse(xmlHttp.responseText).result;
}

function changePage(){
    var userData = JSON.parse(getUserData());
    ReactDOM.unmountComponentAtNode(document.getElementById('root'));
    if(!userData.loggedIn){
        ReactDOM.render(<Login />, document.getElementById('root'));
    }else if(userData.isAdmin){
        ReactDOM.render(<Panel userData={JSON.stringify(userData)}/>, document.getElementById('root'));
    }
}

function getPlayerData(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", adress+"player/data/", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}
function notificationHandler(callbackMsg, callbackPlayer){
    setTimeout(()=>{
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "POST", adress+"notification/");
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));
        xmlHttp.timeout = 30000;
        xmlHttp.onload = function () {
            notificationHandler(callbackMsg, callbackPlayer);
            try{
                const res = JSON.parse(xmlHttp.responseText);
                if(res.msg)
                    callbackMsg(res.msg);
                if(res.player)
                    callbackPlayer(res.player);
            }catch(e){
                console.log(xmlHttp.statusText);
            }
          };
        xmlHttp.onerror = function (e) {
            notificationHandler(callbackMsg, callbackPlayer);
            console.error(xmlHttp.statusText);
          };
        xmlHttp.send(JSON.stringify({id:notificationID}));
    }, 0);
}

export {getUserData, changePage, login as apiLogin, findSong, downloadSong, playSong, switchShuffle, stopSong, notificationHandler, getPlayerData};