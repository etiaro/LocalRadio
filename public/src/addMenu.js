import React from 'react';
import { downloadSong } from './ApiConnection';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import IconButton from '@material-ui/core/IconButton';
import { Close as CloseIcon } from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';


const DownloadBtn = styled(Button)({
});
const UrlInput = styled(TextField)({
    width: "calc(100vw - 3em)"
});
const TabBar = styled(AppBar)({
    position:"absolute",
    top:0,
    fontSize: "large"
});
const CloseBtn = styled(IconButton)({
    position:"absolute",
    right: 0,
    top: 0
});
        
export default class AddMenu extends React.Component {
    constructor(props){
        super(props);
        this.state={
            url: this.props.url ? this.props.url : "",
            btnDisabled: this.props.url ? false : true,
            tab: 0
        }
    }
    
    handleURLChange(e) {
        var val = e.target.value;
        var btnDisabled = true;
        if(((val.includes("v=")|| val.includes("list=")) && val.includes("https://")) || val.includes("https://youtu.be/"))
          btnDisabled = false;
        this.setState({url: val, btnDisabled: btnDisabled});
    }
    downloadCall() {
        downloadSong(this.state.url);
        if(this.props.addCallback) this.props.addCallback();
        this.setState({url: ""});
        this.props.close(true);
    }
    handleChange(event, newValue) {
        this.setState({tab: newValue});
    }
    render(){
        return (<Paper className="window" elevation={2} square={true}>
            <TabBar>
                <p>Dodawanie Ścieżki</p>
                <CloseBtn color="inherit" onClick={() => this.props.close()}>
                    <CloseIcon />
                </CloseBtn>
            </TabBar>
            <div className="window-content">
                <Tabs value={this.state.tab} onChange={(e, n)=>this.handleChange(e, n)} aria-label="download method tabs">
                    <Tab label="Youtube" id="YT" aria-controls="youtube-tab" />
                </Tabs>
                <UrlInput label={"URL"}  margin="dense" onChange={(e)=>this.handleURLChange(e)} disabled={!!this.props.url} value={this.state.url} />
                <p>Podaj adres URL utworu bądź playlisty z serwisu YouTube</p>
                <DownloadBtn disabled={this.state.btnDisabled} variant="contained" color="primary" onClick={() => { this.downloadCall(); }}>
                    Pobierz
                </DownloadBtn>
            </div>
        </Paper>);
    }
}
