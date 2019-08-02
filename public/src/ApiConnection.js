import React from 'react';
import ReactDOM from 'react-dom';
import Panel from './Panel';
import Login from './Login';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

function getUserData(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "http://localhost:80/api/login/data/", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(null);
    return xmlHttp.responseText;
}


function login(response){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "http://localhost:80/api/login", false ); // false for synchronous request
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
    xmlHttp.open( "POST", "http://localhost:80/api/player/download", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send('{"url": "'+ytUrl+'"}');
    console.log(xmlHttp.responseText);
    return false;
}
function playSong(fileName){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "http://localhost:80/api/player/play", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send('{"fileName": "'+fileName+'"}');
    console.log(xmlHttp.responseText);
    return false;
}
function startShuffle(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "http://localhost:80/api/player/play", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send('{"shuffle": true}');
    console.log(xmlHttp.responseText);
    return false;
}
function stopSong(fileName){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "http://localhost:80/api/player/stop", false ); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("x-access-token", cookies.get('accessToken'));//add here a cookie
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    return false;
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

export {getUserData, changePage, login as apiLogin, downloadSong, playSong, startShuffle, stopSong};