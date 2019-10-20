import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { IconButton } from '@material-ui/core';
import {PlayArrow as PlayIcon} from '@material-ui/icons';


import {getPlaylistData} from './ApiConnection';

const useStyles = makeStyles(theme => ({
  root:{
    margin: 15
  },
  item: {
    padding: 10,
  },
  title:{
      fontSize: '1em'
  },
  author:{
      fontSize: '0.8em',
  },
  time:{
    fontSize: '0.8em',
    color: 'GRAY'
  },
  selectPaper:{
    margin: 15,
    padding: 5,
  },
  TextField:{
    width: '100%'
  },
  texts:{
    display: 'inline-block',
    maxWidth: "calc(100% - 50px)"
  },
  button:{
      float: 'right',
      display: 'inline-block',
      color: theme.palette.primary
  }
}));


export default function Playlist(props) {
  const classes = useStyles();
  const [search, setSearch] = useState("");
  const [site, setSite] = useState(1);
  const playlistData = getPlaylistData();//TODO by date

  function translateTime(t){
    var res = "";
    if(t > 60){
        res+= Math.floor(t/60)+" minutes ";
        t%=60;
    }
    res+= t+" seconds";
    return res;
  }
  return (
    <div className="Library">
        <Paper className={classes.selectPaper}>
            
        </Paper>
        <Paper className={classes.root}>
            {playlistData.playlist.map(song => (
            <ListItem key={song.ytid} className={classes.item}>
                <div className={classes.texts}>
                    <Typography variant="h5" component="h3" className={classes.title}>
                    {song.name}
                    </Typography>
                    <Typography component="p" className={classes.author}>
                    {song.author}
                    </Typography>
                    <Typography component="p" className={classes.time}>
                    {translateTime(song.length)}
                    </Typography>
                </div>
                <IconButton className={classes.button}>
                    <PlayIcon/>
                </IconButton>
            </ListItem>
            ))}
        </Paper>
    </div>
  );
}