import React from 'react';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import Collapse from '@material-ui/core/Collapse';
import {AddCircle, Delete} from '@material-ui/icons';
import { Button, IconButton } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider,KeyboardDatePicker} from '@material-ui/pickers';

import {getPlaylistData, sendPlaylistData} from './ApiConnection';

const useStyles = theme => ({
  item: {
    textAlign: "left",
    position: "relative",
    padding: 10,
  },
  title:{
      fontSize: '1em'
  },
  author:{
      fontSize: '0.8em',
  },
  selectPaper:{
    margin: 15,
    padding: 5,
    textAlign: "left"
  },
  selectItem:{
    display: 'inline-block',
    margin: 5
  },
  texts:{
    display: 'inline-block',
    maxWidth: "calc(100% - 50px)"
  },
  root:{
    margin: "20px 0 20px 0"
  },
  schPaper:{
    padding: 5,
    margin:"0 15px 0 15px",
  },
  schTime:{
    display: 'insline-block',
    color: 'gray',
    fontSize: '10pt',
  },
  beginTime:{
    position: "absolute",
    right: "1.5em",
    top: "1.1em",
    fontSize: '0.8em'
  },
  endTime:{
    position: "absolute",
    right: "1.5em",
    bottom: "1.1em",
    fontSize: '0.8em'
  }
});

function Options(props) {
  var style = {position:"absolute", top:0, left:"calc(50% - 125px)", width: 250};

  if(props.toppos) 
    style = Object.assign(style, {display:"block", top:props.toppos});
  else
    style = Object.assign(style, {display:"none"});

  return (
    <Paper style={style}>
      <Collapse in={props.collapse} onExited={()=>props.exitCb()}>
        <ListItem button onClick={()=>props.optionsFunctions.delete()}>
          <ListItemIcon><Delete/></ListItemIcon>
          <ListItemText primary="Delete" />
        </ListItem>
      </Collapse>
    </Paper>
  );
};

class Playlist extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      playlist: {amplifier: {day:[], enabledTimes:[]},playlist:[]}, 
      date:new Date(),
      optionsPos: 0,
      optionsCollapse: false,
      optionsCb: ()=>{},
      optionsFunctions:{delete:()=>{}}
    };
  }
  componentDidMount(){
    this.updateData();
  }
  updateData = ()=>{
    getPlaylistData(this.state.date, (res)=>{
      this.setState({playlist:res});
    });
  }
  handleDateChange(newDate){
    newDate = new Date(newDate);
    if(isNaN(newDate)) newDate = new Date();
    console.log(newDate);
    this.setState({date:newDate}, ()=>{
      this.updateData();
    });
  }
  countEndTime(begin, length, schEnd){
    var d = new Date(begin*1000+length*1000);
    var d2 = new Date(begin*1000+length*1000);
    d2.setHours(schEnd.hour);
    d2.setMinutes(schEnd.minutes);
    d2.setSeconds(0);
    if(d.getTime() < d2.getTime())
      return d;
    else
      return d2;
  }
  formatTime(time){
    if(time.hasOwnProperty("hour") && time.hasOwnProperty("minutes")){
      var str = "";
      if(time.hour < 10) str+="0"+time.hour;
      else str+= time.hour;
      str+=":";
      if(time.minutes < 10) str+="0"+time.minutes;
      else str+= time.minutes;
      return str;
    }
    if(typeof(time)==="number")
      time = new Date(time*1000);
    return time.toLocaleTimeString()
  }
  addClick(time){
    const date = new Date(this.state.date);
    if(time.hour){
      date.setHours(time.hour);
      date.setMinutes(time.minutes);
    }else{
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());
    }
    date.setSeconds(0);
    this.props.libraryShow((ytid)=>{
      sendPlaylistData({ytid: ytid, date:date});
    });
  }
  hideOptions(cb){
    if(cb === undefined) cb = ()=>{};
    this.setState({optionsCollapse: false, optionsCb: cb});
  }
  showOptions(toppos, songId){
    if(this.state.optionsCollapse)
      this.hideOptions(()=>{
        this.showOptions(toppos);
      })
    else
      this.setState({optionsPos: toppos, optionsCb: ()=>{}, optionsCollapse: true, optionsFunctions:{
        delete: ()=>{sendPlaylistData({id:songId, delete:true}); this.hideOptions()}
      }});
  }
  render(){
    const {classes} = this.props;
    const schedule = this.state.playlist.amplifier.day[this.state.date.getDay()] ? this.state.playlist.amplifier.enabledTimes : [];
    const playlist = this.state.playlist.playlist;
    for(var i = 0; i < schedule.length; i++)
      schedule[i].songs = [];

    var schInd = 0;
    if(schedule.length > 0)
      playlist.map((song, ind)=>{
        var b = new Date(song.date*1000);
        b.hour = b.getHours(); b.minutes = b.getMinutes();
        var actE = schedule[schInd].end;
        while(b.hour > actE.hour || (b.hour===actE.hour && b.minutes > actE.minutes)){
          schInd++;actE = schedule[schInd].end;
        }
        song.addBtn = "";
        const e = this.countEndTime(song.date, song.length, actE);
        e.hour = e.getHours(); e.minutes = e.getMinutes();
        if(e.hour < actE.hour || (e.hour===actE.hour && e.minutes < actE.minutes))
          if(ind+1 < playlist.length){
            var b2 = new Date(playlist[ind+1].date*1000);
            b2.hour = b2.getHours(); b2.minutes = b2.getMinutes();
            if(b2.hour > e.hour || (b2.hour===e.hour && b2.minutes > e.minutes))
              song.addBtn = (<IconButton onClick={()=>{this.addClick(e)}}>
                              <AddCircle/>
                            </IconButton>);
            
          }else 
            song.addBtn = (<IconButton onClick={()=>{this.addClick(e)}}>
                              <AddCircle/>
                            </IconButton>);
        if(schInd < schedule.length) schedule[schInd].songs.push(song);
        return song;
      });
    for(i = 0; i < schedule.length; i++){
      schedule[i].addBtn = "";
      const actB = schedule[i].begin
      if(schedule[i].songs.length){
        var b = new Date(schedule[i].songs[0].date*1000);
        b.hour = b.getHours(); b.minutes = b.getMinutes();
        if(b.hour > actB.hour || (b.hour === actB.hour && b.minutes > actB.minutes))
          schedule[i].addBtn = (<IconButton onClick={()=>{this.addClick(actB)}}>
                                <AddCircle/>
                              </IconButton>);
      }else
          schedule[i].addBtn = (<IconButton onClick={()=>{this.addClick(actB)}}>
                                <AddCircle/>
                              </IconButton>);
    }

    return (
      <div className="Playlist" onClick={(e)=>{if(!e.target.classList.contains(classes.item)) this.hideOptions()}}>
          <Paper className={classes.selectPaper}>
            <Grid container direction="row" alignItems="center">
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <KeyboardDatePicker className={classes.selectItem} margin="normal" label="Date" value={this.state.date} onChange={(d)=>this.handleDateChange(d)}/>
              </MuiPickersUtilsProvider>
              
              <Button className={classes.selectItem} variant="contained" color="primary" onClick={this.props.scheduleMenuSwitch}>
                Schedule
              </Button>
            </Grid>
          </Paper>
          
          {schedule.map((time,ind) => (
            <div key={ind} className={classes.root}>
            <Typography component="p" className={classes.schTime}>
              {this.formatTime(time.begin)}
            </Typography>
              <Paper className={classes.schPaper} elevation={3}>
                {time.addBtn}
                {time.songs.map((song, ind) => (
                  <div key={song.id}>
                    <ListItem button className={classes.item} elevation={2}
                      onClick={(e)=>this.showOptions(e.target.offsetTop, song.id)}>
                      <div className={classes.texts}>
                        <Typography variant="h5" component="h3" className={classes.title}>
                        {song.name}
                        </Typography>
                        <Typography component="p" className={classes.author}>
                        {song.author}
                        </Typography>
                      </div>
                      <Typography component="p" className={classes.beginTime}>
                        {this.formatTime(song.date)}
                      </Typography>
                      <Typography component="p" className={classes.endTime}>
                        {this.formatTime(this.countEndTime(song.date,song.length, time.end))}
                      </Typography>
                    </ListItem>
                    {song.addBtn}
                  </div>)
                )}
              </Paper>
            <Typography component="p" className={classes.schTime}>
              {this.formatTime(time.end)}
            </Typography>
            </div>
          ))}
          <Options optionsFunctions={this.state.optionsFunctions}
          toppos={this.state.optionsPos} collapse={this.state.optionsCollapse} exitCb={()=>{this.state.optionsCb()}}/>
      </div>
    );
  }
}
Playlist.propTypes = {
  classes: PropTypes.object.isRequired,
};
export default withStyles(useStyles)(Playlist);