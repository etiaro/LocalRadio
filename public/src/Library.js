import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { IconButton } from '@material-ui/core';
import {PlayArrow as PlayIcon} from '@material-ui/icons';


import {findSong, playSong} from './ApiConnection';

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
  searchPaper:{
    margin: 15,
    padding: 5,
  },
  TextField:{
    width: '100%'
  },
  texts:{
    display: 'inline-block'
  },
  button:{
      float: 'right',
      display: 'inline-block',
      colot: theme.palette.primary
  }
}));


export default function Library(props) {
  const classes = useStyles();
  const [search, setSearch] = useState("");
  const [site, setSite] = useState(1);
  const songs = findSong({songData:{name: search, site: site}});

  function handleSearchChange(event){
    setSearch(event.target.value);
  }

  function handleScroll(e){
    if( e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight)){
        setSite(site+1);
    }
  }

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
    <div className="Library" onScroll={(e)=>handleScroll(e)}>
        <Paper className={classes.searchPaper}>
            <TextField className={classes.TextField} id="standard-dense" label={"Search"}  margin="dense" onChange={(e)=>handleSearchChange(e)}/>
        </Paper>
        <Paper className={classes.root}>
            {songs.map(song => (
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
                <IconButton className={classes.button} onClick={()=>playSong(song.file)}>
                    <PlayIcon/>
                </IconButton>
            </ListItem>
            ))}
        </Paper>
    </div>
  );
}