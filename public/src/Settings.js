import React from 'react';
import { Link} from "react-router-dom";

import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import { ExitToApp, LibraryBooks, PlaylistAddCheck, History, GitHub, AddComment} from '@material-ui/icons';
import {logout} from './ApiConnection'
import { FormControlLabel, Paper, Radio, RadioGroup } from '@material-ui/core';


const useStyles = makeStyles(theme => ({
    drawer:{
        position: "relative"
    },
    pickMenu:{
        width: 300,
        maxWidth: "90vw",
        maxHeight: "calc(100% - 15em)",
        overflow: "auto"
    },
    normalText:{
        textDecoration: "none",
        color: "BLACK"
    },
    amp:{
        position: "absolute",
        bottom: 0,
        height: "13em",
        width: 150
    },
    ampText:{
        color: "GRAY",
        margin: "0.2em"
    },
    vol:{
        position: "absolute",
        bottom: 0,
        height: "13em",
        width: 150,
        left: 150
    },
    volText:{
        color: "GRAY",
        margin: "0.2em"
    },
    slider:{
        height: "9em"
    }
}));

export default function Settings(props) {
    const classes = useStyles();
    return (
        <Drawer className={classes.drawer} anchor="right" open={props.open} onClose={props.close}>
                <List className={classes.pickMenu}>
                    <ListItem button onClick={()=>openGithub()}>
                        <ListItemIcon><GitHub/></ListItemIcon>
                        <ListItemText primary="Github" />
                    </ListItem>
                    <Link to="/library" className={classes.normalText}>
                        <ListItem button onClick={()=>props.openLibrary()}>
                            <ListItemIcon><LibraryBooks/></ListItemIcon>
                            <ListItemText primary="Biblioteka" />
                        </ListItem>
                    </Link>
                    <Link to="/playlist" className={classes.normalText}>
                        <ListItem button onClick={()=>props.openPlaylist()}>
                            <ListItemIcon><PlaylistAddCheck/></ListItemIcon>
                            <ListItemText primary="Playlista" />
                        </ListItem>
                    </Link>
                    <Link to="/history" className={classes.normalText}>
                        <ListItem button onClick={()=>props.openHistory()}>
                            <ListItemIcon><History/></ListItemIcon>
                            <ListItemText primary="Historia" />
                        </ListItem>
                    </Link>
                    <Link to="/suggestions" className={classes.normalText}>
                        <ListItem button onClick={()=>props.openSuggestions()}>
                            <ListItemIcon><AddComment/></ListItemIcon>
                            <ListItemText primary="Sugestie" />
                        </ListItem>
                    </Link>
                    <ListItem button onClick={()=>logout()}>
                        <ListItemIcon><ExitToApp/></ListItemIcon>
                        <ListItemText primary="Wyloguj" />
                    </ListItem>
                </List>
                <Paper className={classes.amp}>
                    <p className={classes.ampText}>Wzmacniacz</p>
                    <RadioGroup aria-label="amplifier mode" name="ampMode" value={props.amplifierMode} onChange={(e)=>props.setAmpMode(e)}>
                        <FormControlLabel value="2" control={<Radio />} label="On" />
                        <FormControlLabel value="1" control={<Radio />} label="Auto" />
                        <FormControlLabel value="0" control={<Radio />} label="Off" />
                    </RadioGroup>
                </Paper>
                <Paper className={classes.vol}>
                    <Typography className={classes.volText}>Głośność</Typography>
                    <div className={classes.slider}>
                    <Slider
                        orientation="vertical"
                        value={props.volume}
                        onChangeCommitted={(e, v)=>props.setVolume(e, v)}
                        onChange={(e, v)=>props.setVolumeTemp(e, v)}
                        aria-labelledby="vertical-slider"
                        marks={[{value:100, label:100},{value:50, label:50}, {value:0, label:0}]}
                        />
                    </div>
                </Paper>
        </Drawer> 
    );
};



function openGithub(){
    window.open('https://github.com/etiaro/LocalRadio', '_blank');
}