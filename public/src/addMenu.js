import React from 'react';
import clsx from 'clsx';

import {downloadSong} from './ApiConnection';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import IconButton from '@material-ui/core/IconButton';
import { Close as CloseIcon } from '@material-ui/icons';



const useStyles = makeStyles(theme => ({
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 400
    },
    button: {
      margin: theme.spacing(1),
    },
    appBar: {
        position:"absolute",
        top:0,
        fontSize: "large"
    },
    close:{
        position:"absolute",
        right: 0,
        top: 0
    }
}));

export default function MusicToolbar(props) {
    const classes = useStyles();
    var style = {
        display: "none"
    }

    var url = "URL";
    function handleURLChange(e){
        url = e.target.value;
    }

    function downloadCall(url){
        downloadSong(url);
        props.close()
    }
    const [value, setValue] = React.useState(0);
    
    function handleChange(event, newValue) {
      setValue(newValue);
    }
    
    if(props.isVisible)
        style.display = "block";
    return (
        <Paper id="addPaper" elevation={2} square={true} style={style}>
            <AppBar className={classes.appBar}>
                <p>Dodawanie Ścieżki</p>
                <IconButton color="inherit" onClick={()=>props.close()}  className={classes.close} >
                    <CloseIcon />
                </IconButton>
            </AppBar>
            <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label="Youtube" id="YT" aria-controls="youtube-tab" />
                </Tabs>
            <TextField
                id="standard-dense"
                label={"URL"}
                className={clsx(classes.textField, classes.dense)}
                margin="dense"
                onChange={handleURLChange} 
            />
            <p>Enter URL of video or playlist</p>
            <Button variant="contained" color="primary" onClick={()=>{downloadCall(url)}} className={classes.button}>
                Download
            </Button>
        </Paper>
    );
}