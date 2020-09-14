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
            url: "",
            tab: 0
        }
    }
    
    
    handleURLChange(e) {
        this.setState({url: e.target.value});
    }
    downloadCall() {
        downloadSong(this.state.url);
        this.setState({url: ""});
        this.props.close();
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
                <UrlInput label={"URL"}  margin="dense" onChange={(e)=>this.handleURLChange(e)} value={this.state.url} />
                <p>Enter URL of video or playlist</p>
                <DownloadBtn variant="contained" color="primary" onClick={() => { this.downloadCall(); }}>
                    Download
                </DownloadBtn>
            </div>
        </Paper>);
    }
}
