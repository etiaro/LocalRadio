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
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider,KeyboardDatePicker} from '@material-ui/pickers';
import {Close as CloseIcon,PlayArrow as PlayIcon} from '@material-ui/icons';


import {getHistory} from './ApiConnection';


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
  startTime:{
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


export default function History(props) {
  const classes = useStyles();
  const [date, setDate] = useState(new Date());
  const [site, setSite] = useState(1);
  const [songs,  setSongs] = useState([]);
  const [loading, isLoading] = useState(true);
  const [totalNum, setTotalNum] = useState(-1);
 
  useEffect(()=>{
    var isMounted = true;
    if(!songs || totalNum !== songs.length){
      getHistory(date, site, (res, totalNum)=>{
        if(isMounted){
          isLoading(false);
          setTotalNum(totalNum);
          setSongs(res);
        }
      });
    }
    document.getElementsByClassName("History")[0].parentElement.onscroll = handleScroll;
    return ()=>{isMounted = false;}
  }, [date, site, totalNum, songs]);

  function handleDateChange(d){
    d = new Date(d);
    if(isNaN(d)) d = new Date();
    setTotalNum(-1);
    setDate(d);
  }

  function handleScroll(e){
    console.log(e.target.offsetHeight + e.target.scrollTop,  e.target.scrollHeight - 50)
    if(!loading && e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight - 50){
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

  var LoadingWheel = songs && songs.length !== totalNum ?(<CircularProgress className={classes.loadingWheel}/>):null;

  if(!songs) return(<div/>)
  return (
    <div className="History" onScroll={(e)=>handleScroll(e)}>
        <Paper className={classes.searchPaper}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker className={classes.selectItem} margin="normal" label="Date" value={date} onChange={(d)=>handleDateChange(d)}/>
          </MuiPickersUtilsProvider>
        </Paper>
        <Paper className={classes.root}>
          {songs.map(song => (
            <div key={song.id}>
              <Typography component="p" className={classes.startTime}>
                {new Date(song.date).toLocaleDateString()+" "+new Date(song.date).toLocaleTimeString()}
              </Typography>
              <ListItem className={classes.item}>
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
            </div>
          ))}
          {LoadingWheel}
        </Paper>
    </div>
  );
}