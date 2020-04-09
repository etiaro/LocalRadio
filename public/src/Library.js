import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ListItem from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { IconButton } from '@material-ui/core';
import {PlayArrow as PlayIcon} from '@material-ui/icons';


import {findSong, playSong} from './ApiConnection';

const useStyles = makeStyles(theme => ({
  root:{
    margin: 15,
    textAlign: "center"
  },
  item: {
    padding: 10,
    textAlign: "left"
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
    display: 'inline-block',
    maxWidth: "calc(100% - 50px)"
  },
  button:{
      float: 'right',
      display: 'inline-block',
      color: theme.palette.primary
  },
  loadingWheel:{
    margin: "15px"
  }
}));


export default function Library(props) {
  const classes = useStyles();
  const [search, setSearch] = useState("");
  const [site, setSite] = useState(1);
  const [songs,  setSongs] = useState([]);
  const [loading, isLoading] = useState(true);
  const [totalNum, setTotalNum] = useState(-1);
  const isWindowed = props.isWindowed;
 
  useEffect(()=>{  
    if(totalNum !== songs.length){
      findSong({songData:{name: search, site: site}}, (res, totalNum)=>{
        isLoading(false);
        setTotalNum(totalNum);
        setSongs(res);
      });
    }
  }, [search, site, totalNum, songs]);

  function handleSearchChange(event){
    setTotalNum(-1);
    setSearch(event.target.value);
  }

  function handleScroll(e){
    if(!loading && e.target.scrollTop >= (e.target.scrollHeight - e.target.offsetHeight)){
        isLoading(true);
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
  var LoadingWheel = songs.length !== totalNum ?(<CircularProgress className={classes.loadingWheel}/>):null;

  let songList = ({});
  if(!isWindowed){
    songList = songs.map(song => (
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
          <IconButton className={classes.button} onClick={()=>playSong(song.file, song.name, song.length)}>
              <PlayIcon/>
          </IconButton>
      </ListItem>
      ));
  }else{
    songList = songs.map(song => (
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
      </ListItem>
      ));
  }

  return (
    <div className="Library" onScroll={(e)=>handleScroll(e)}>
        <Paper className={classes.searchPaper}>
            <TextField className={classes.TextField} label={"Search"}  margin="dense" onChange={(e)=>handleSearchChange(e)}/>
        </Paper>
        <Paper className={classes.root}>
            {songList}
            {LoadingWheel}
        </Paper>
    </div>
  );
}