import React, {createRef} from 'react';
import { sendScheduleData, getPlaylistData } from './ApiConnection';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import { Delete, AddCircle, Close as CloseIcon} from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';

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
const HourInput = styled(TextField)({
    width:"5em"
});
        
export default class ScheduleMenu extends React.Component {
    constructor(props){
        super(props);
        this.state={
            url: "",
            tab: 0,
            day:[false,false,false,false,false,false,false],
            enabledTimes:[],
            loading: true
        }
        this.inputRefs = [];
    }
    
    componentDidMount(){
        this.updateData();
    }
    
    updateData = ()=>{
        getPlaylistData(this.state.date, (res)=>{
            this.setState({loading:false, day:res.amplifier.day, enabledTimes:res.amplifier.enabledTimes});
        });
    }
    formatTime(time){
        var str = "";
        if(time.hour < 10) str+="0"+time.hour;
        else str+= time.hour;
        str+=":";
        if(time.minutes < 10) str+="0"+time.minutes;
        else str+= time.minutes;
        return str;
    }

    changeDay(e, d){
        var day = this.state.day;
        day[d] = e.target.checked;
        this.setState({day: day});
    }
    changeTime(e, ind, isBeg){
        var MAX = ind+1 < this.state.enabledTimes.length ? this.state.enabledTimes[ind+1].begin : {hour:23, minutes:59};
        var MIN = ind-1 >= 0 ? this.state.enabledTimes[ind-1].end : {hour:0, minutes:0};
        if(isBeg) MAX = {hour: this.state.enabledTimes[ind].end.hour, minutes:this.state.enabledTimes[ind].end.minutes};
        else MIN = {hour: this.state.enabledTimes[ind].begin.hour, minutes:this.state.enabledTimes[ind].begin.minutes};
        var time = e.target.value;
        var hour, minutes;
        if(time.search(":") !== -1){
            hour = parseInt(time.split(":")[0].substr(0, 2));
            minutes = parseInt(time.split(":")[1].substr(0, 2));
        }else{
            hour = parseInt(time.substr(0, 2));
            minutes = 0;
        }

        var eT = this.state.enabledTimes;
        if(hour > 23) hour = 23;
        if(minutes > 59) minutes = 59;
        if(hour > MAX.hour || (hour === MAX.hour && minutes > MAX.minutes)){
            hour = MAX.hour; minutes = MAX.minutes;
        }
        if(hour < MIN.hour || (hour === MIN.hour && minutes < MIN.minutes)){
            hour = MIN.hour; minutes = MIN.minutes;
        }
        if(isBeg)
            eT[ind].begin = {hour:hour, minutes:minutes};
        else
            eT[ind].end = {hour:hour, minutes:minutes};

        var cursor = e.target.selectionStart;
        if(cursor === 2) cursor = 3;
        this.setState({enabledTimes: eT},
            ()=>{
                if(isBeg)
                    this.inputRefs[ind].begin.current.setSelectionRange(cursor,cursor+1);
                else
                    this.inputRefs[ind].end.current.setSelectionRange(cursor,cursor+1);
            });
    }
    addTime(pos){
        var MIN = pos >= 0 ? this.state.enabledTimes[pos].end : {hour:0, minutes:0};
        var eT = this.state.enabledTimes;
        eT.splice(pos+1, 0, {begin:MIN,end:MIN});
        this.setState({enabledTimes:eT});
    }
    deleteTime(pos){
        var eT = this.state.enabledTimes;
        eT.splice(pos, 1);
        this.setState({enabledTimes: eT});
    }
    changeCall(){
        sendScheduleData({enabledTimes: this.state.enabledTimes, day: this.state.day});
        this.props.close();
    }
    handleURLChange(e) {
        this.setState({url: e.target.value});
    }
    handleChange(event, newValue) {
        this.setState({tab: newValue});
    }
    render(){
        this.inputRefs = [];
        for (var i = 0; i < this.state.enabledTimes.length; i++)
            this.inputRefs.push({begin: createRef(), end:createRef()});

        let communicate;
        if(this.state.loading)
            communicate = (<CircularProgress/>);
        else if(this.state.enabledTimes.length === 0)
            communicate = (<p>Brak uruchomień</p>);
        
        return (<Paper className="window" elevation={2} square={true}>
            <TabBar>
                <p>Plan Działania</p>
                <CloseBtn color="inherit" onClick={() => this.props.close()}>
                    <CloseIcon />
                </CloseBtn>
            </TabBar>
            <div className="window-content">
                <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[1]} onChange={(e)=>{this.changeDay(e, 1);}} name="day0" />}
                        label="Pon"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[2]} onChange={(e)=>{this.changeDay(e, 2);}} name="day1" />}
                        label="Wt"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[3]} onChange={(e)=>{this.changeDay(e, 3);}} name="day2" />}
                        label="Śr"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[4]} onChange={(e)=>{this.changeDay(e, 4);}} name="day3" />}
                        label="Czw"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[5]} onChange={(e)=>{this.changeDay(e, 5);}} name="day4" />}
                        label="Pt"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[6]} onChange={(e)=>{this.changeDay(e, 6);}} name="day5" />}
                        label="Sob"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.day[0]} onChange={(e)=>{this.changeDay(e, 0);}} name="day6" />}
                        label="Ndz"
                    />
                </FormGroup>
                <IconButton onClick={()=>{this.addTime(-1)}}>
                    <AddCircle/>
                </IconButton>
                {communicate}
                {this.state.enabledTimes.map((time, ind) => (
                    <div key={ind}>
                        <Grid container direction="row" justify="center" alignItems="center">
                            <HourInput inputRef={this.inputRefs[ind].begin} size="small" label="Początek" variant="outlined" onChange={(e)=>{this.changeTime(e, ind, true);}} value={this.formatTime(time.begin)}/>
                            <Typography component="span">
                                {"->"}
                            </Typography>
                            <HourInput inputRef={this.inputRefs[ind].end} size="small" label="Koniec" variant="outlined" onChange={(e)=>{this.changeTime(e, ind, false);}} value={this.formatTime(time.end)}/>
                            <IconButton onClick={()=>{this.deleteTime(ind)}}>
                                <Delete/>
                            </IconButton>
                        </Grid>
                        <IconButton onClick={()=>{this.addTime(ind)}}>
                            <AddCircle/>
                        </IconButton>
                    </div>
                ))}
                <Button variant="contained" color="primary" onClick={() => { this.changeCall(); }}>
                    Zmień
                </Button>
            </div>
        </Paper>);
    }
}
