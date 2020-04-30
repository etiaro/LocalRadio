import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { LibraryBooks, PlaylistAddCheck, History, GitHub} from '@material-ui/icons';



const useStyles = makeStyles(theme => ({
    pickMenu:{
        width: 300,
        maxWidth: "90vw"
    }
}));

export default function Settings(props) {
    const classes = useStyles();
    return (
        <Drawer anchor="right" open={props.open} onClose={props.close}>
            <List className={classes.pickMenu}>
                <ListItem button onClick={()=>openGithub()}>
                    <ListItemIcon><GitHub/></ListItemIcon>
                    <ListItemText primary="Github" />
                </ListItem>
                <ListItem button onClick={()=>props.openLibrary()}>
                    <ListItemIcon><LibraryBooks/></ListItemIcon>
                    <ListItemText primary="Library" />
                </ListItem>
                <ListItem button onClick={()=>props.openPlaylist()}>
                    <ListItemIcon><PlaylistAddCheck/></ListItemIcon>
                    <ListItemText primary="Playlist" />
                </ListItem>
                <ListItem button onClick={()=>props.openHistory()}>
                    <ListItemIcon><History/></ListItemIcon>
                    <ListItemText primary="History" />
                </ListItem>
            </List>
        </Drawer> 
    );
};



function openGithub(){
    window.open('https://github.com/etiaro/LocalRadio', '_blank');
}