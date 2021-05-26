import React, { useState, useEffect } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem2 from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ListItem from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import { styled } from '@material-ui/core/styles';
import {Close as CloseIcon,PlayArrow as PlayIcon, Delete as DeleteIcon} from '@material-ui/icons';


import {findSong, playSong, deleteSong} from './ApiConnection';


const CloseBtn = styled(IconButton)({
  position:"absolute",
  right: 0,
  top: 0
});
const TabBar = styled(AppBar)({
  position:"absolute",
  top:0,
  fontSize: "large"
});

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
  },
  url:{
    textDecoration: 'none'
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
    var isMounted = true;
    findSong({songData:{name: search, site: site}}, (res, totalNum)=>{
      if(isMounted){
        isLoading(false);
        setTotalNum(totalNum);
        setSongs(res);
      }
    });
    return ()=>{isMounted = false;}
  }, [search, site, totalNum, props.libUpdater]);

  function handleSearchChange(event){
    setTotalNum(-1);
    setSearch(event.target.value);
  }

  function handleScroll(e){
    if(!loading && e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight - 50 && totalNum > songs.length){
        isLoading(true);
        setSite(site+1);
    }
  }

  function translateTime(t){
    var res = "";
    if(t > 60){
        res+= Math.floor(t/60)+" minut ";
        t%=60;
    }
    res+= t+" sekund";
    return res;
  }
  function selectItem(ytid){
    props.selectCallback(ytid);
    props.close();
  }
  var LoadingWheel = songs && songs.length !== totalNum ?(<CircularProgress className={classes.loadingWheel}/>):null;

  if(!songs) return(<div/>)
  if(!isWindowed){
    return (
      <div className="Library" onScroll={(e)=>handleScroll(e)}>
          <Paper className={classes.searchPaper}>
              <TextField className={classes.TextField} label={"Szukaj"}  margin="dense" onChange={(e)=>handleSearchChange(e)}/>
          </Paper>
          <div style={{display:"none"}}>{props.libUpdater}</div>
          <Paper  className={classes.root}>
            {songs.map(song => (
              <ListItem key={song.ytid} className={classes.item}>
                <div className={classes.texts}>
                  <Typography variant="h5" component="h3" className={classes.title}>
                  <a href = {"https://www.youtube.com/watch?v=" + song.ytid} className={classes.url}> {song.name} </a>
                  </Typography>
                  <Typography component="p" className={classes.author}>
                  {song.author}
                  </Typography>
                  <Typography component="p" className={classes.time}>
                  {translateTime(song.length)}
                  </Typography>
                </div>
                <IconButton className={classes.button} onClick={()=>playSong(song.file, song.name, song.length, song.ytid)}>
                  <PlayIcon/>
                </IconButton>
                <IconButton className={classes.button} onClick={()=>deleteSong(song.ytid)}>
                  <DeleteIcon/>
                </IconButton>
              </ListItem>
            ))}
            {LoadingWheel}
          </Paper>
      </div>
    );
  }else{
    return (
      <Paper className="window" elevation={2} square={true}>
        <TabBar>
            <p>Biblioteka</p>
            <CloseBtn color="inherit" onClick={() => props.close()}>
                <CloseIcon />
            </CloseBtn>
        </TabBar>
        <div className="window-content" onScroll={(e)=>handleScroll(e)}>
            <Paper className={classes.searchPaper}>
                <TextField className={classes.TextField} label={"Szukaj"}  margin="dense" onChange={(e)=>handleSearchChange(e)}/>
            </Paper>
            <div style={{display:"none"}}>{props.libUpdater}</div>
            <Paper className={classes.root}>
              <List>
                {songs.map(song => (
                  <ListItem2 button key={song.ytid} className={classes.item} onClick={()=>{selectItem(song.ytid)}}>
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
                  </ListItem2>
                ))}
              </List>
              {LoadingWheel}
            </Paper>
        </div>
      </Paper>
    );
  }
}