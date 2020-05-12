import React, { useState, useEffect, useCallback } from 'react';
//TODO ALLL
//1st class suggest
//2nd class suggestions
//3rd class userWindow

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ListItem from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import { styled } from '@material-ui/core/styles';
import {Close as CloseIcon, Check as CheckIcon} from '@material-ui/icons';


import {getSuggestions, suggest} from './ApiConnection';



const UrlInput = styled(TextField)({
  width: "calc(100vw - 3em)"
});
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
    textAlign: "left",
    position: "relative",
    minHeight: "3.7em"
  },
  url:{
      fontSize: '1em'
  },
  author:{
      fontSize: '0.8em',
      position: "absolute",
      right: "1.5em",
      bottom: "1.1em",
  },
  authorImg:{
    width:'1.8em',
    position: "absolute",
    right: "1.5em",
    top: "1.1em",
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
    maxWidth: "calc(100% - 50px)",
    whiteSpace:"nowrap",
    overflow: "hidden"
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


export default function Suggestions(props) {
  const classes = useStyles();
  const [site, setSite] = useState(1);
  const [suggests,  setSuggests] = useState([]);
  const [loading, isLoading] = useState(true);
  const [totalNum, setTotalNum] = useState(-1);
  const [onlyMine, setOnlyMine] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [denied, setDenied] = useState(false);
  const [changed, setChanged] = useState(0);
 
  const handleScroll = useCallback((e)=>{
    if(!loading && e.target.offsetHeight + e.target.scrollTop >= e.target.scrollHeight - 50 && totalNum > suggests.length){
        isLoading(true);
        setSite(site=>{return site+1;});
    }
  }, [loading, totalNum, suggests.length]);
  useEffect(()=>{
    var isMounted = true;
    getSuggestions({userId: onlyMine ? props.userId : null, site:site, waiting: waiting, accepted: accepted, denied: denied}, 
    (res, totalNum)=>{
      if(isMounted){
        isLoading(false);
        setTotalNum(totalNum);
        setSuggests(res);
      }
    });
    document.getElementsByClassName("Suggestions")[0].parentElement.onscroll = handleScroll;
    return ()=>{isMounted = false;}
  }, [site, totalNum, onlyMine, accepted, denied, waiting, changed, handleScroll, props.userId]);
  
  function getSugColor(sug){
    if(sug.status===0) return "WHITE";
    if(sug.status===1) return "LIGHTGREEN";
    if(sug.status===-1) return "ORANGERED";
  };
  function deny(song){
    suggest({id: song.id, status:-1}, ()=>{
      setChanged(changed+1);
    });
  }
  function accept(song){
    props.openAddMenu(()=>{
      suggest({id: song.id, status:1}, ()=>{
        setChanged(changed+1);
      });
    }, song.url);
  }

  var LoadingWheel = suggests && suggests.length !== totalNum ?(<CircularProgress className={classes.loadingWheel}/>):null;

  if(!suggests) return(<div/>)
  let checkBox = "";
  if(props.userId){
    checkBox = (<p>
          <Checkbox
            checked={onlyMine}
            onChange={()=>setOnlyMine(!onlyMine)}
            inputProps={{ 'aria-label': 'primary checkbox' }}
          /> 
          Pokaż tylko moje
          </p>);
  }
  
  var searchMenu = ""
  if(props.isAdmin)
    searchMenu = (<Paper className={classes.searchPaper}>
                    <p><Checkbox
                      checked={waiting}
                      onChange={()=>setWaiting(!waiting)}
                      inputProps={{ 'aria-label': 'primary checkbox' }}
                    /> 
                    Oczekujące</p>
                    <p><Checkbox
                      checked={accepted}
                      onChange={()=>setAccepted(!accepted)}
                      inputProps={{ 'aria-label': 'primary checkbox' }}
                    /> 
                    Zaakceptowane</p>
                    <p><Checkbox
                      checked={denied}
                      onChange={()=>setDenied(!denied)}
                      inputProps={{ 'aria-label': 'primary checkbox' }}
                    /> 
                    Odrzucone</p>
                  </Paper>);
  else
    searchMenu = (<Paper className={classes.searchPaper}>
                    <Button variant="contained" color="primary" onClick={()=>props.suggestWindowSwitch()}>
                      Sugeruj
                    </Button>
                    {checkBox}
                    <p>
                    <Checkbox
                      checked={waiting}
                      onChange={()=>setWaiting(!waiting)}
                      inputProps={{ 'aria-label': 'primary checkbox' }}
                    />
                    Oczekujące </p>
                    <p><Checkbox
                      checked={accepted}
                      onChange={()=>setAccepted(!accepted)}
                      inputProps={{ 'aria-label': 'primary checkbox' }}
                    />
                    Zaakceptowane </p>
                    <p><Checkbox
                      checked={denied}
                      onChange={()=>setDenied(!denied)}
                      inputProps={{ 'aria-label': 'primary checkbox' }}
                    /> 
                    Odrzucone</p>
                  </Paper>);
  return (
    <div className="Suggestions" onScroll={(e)=>handleScroll(e)}>
        {searchMenu}
        <Paper className={classes.root}>
          {suggests.map(sug => (
            <div key={sug.id}>
              <ListItem className={classes.item} style={{backgroundColor:getSugColor(sug)}}>
                <div className={classes.texts}>
                  <Typography variant="h5" component="h3" className={classes.url}>
                    <a href={sug.url} target="_blank" rel="noopener noreferrer">{sug.url}</a>
                  </Typography>
                  {sug.status!==1 && props.isAdmin ? (<span>
                    <IconButton onClick={() => accept(sug)}>
                        <CheckIcon />
                    </IconButton>
                    <IconButton disabled={sug.status===-1} onClick={() => deny(sug)}>
                        <CloseIcon />
                    </IconButton></span>) : ""}
                  <Typography component="p" className={classes.author}>
                    {sug.name}
                  </Typography>
                  <img className={classes.authorImg} src={sug.picture} alt="author"/>
                </div>
              </ListItem>
            </div>
          ))}
          {LoadingWheel}
        </Paper>
    </div>
  );
}

export class Suggest extends React.Component {
  constructor(props){
      super(props);
      this.state={
          url: "",
          btnDisabled: true,
          tab: 0
      }
  }
  
  
  handleURLChange(e) {
      var val = e.target.value;
      var btnDisabled = true;
      if((val.includes("v=") && val.includes("https://")) || val.includes("https://youtu.be/"))
        btnDisabled = false;
      this.setState({url: val, btnDisabled: btnDisabled});
  }
  suggestCall() {
      suggest({userId: this.props.userId, url: this.state.url}, ()=>{});
      this.setState({url: ""});
      this.props.close();
  }
  handleChange(event, newValue) {
      this.setState({tab: newValue});
  }
  render(){
      return (<Paper className="window" elevation={2} square={true}>
          <TabBar>
              <p>Sugerowanie nowego utworu</p>
              <CloseBtn color="inherit" onClick={() => this.props.close()}>
                  <CloseIcon />
              </CloseBtn>
          </TabBar>
          <div className="window-content">
              <Tabs value={this.state.tab} onChange={(e, n)=>this.handleChange(e, n)} aria-label="download method tabs">
                  <Tab label="Youtube" id="YT" aria-controls="youtube-tab" />
              </Tabs>
              <UrlInput label={"URL"}  margin="dense" onChange={(e)=>this.handleURLChange(e)} value={this.state.url} />
              <p>Podaj adres URL utworu z serwisu YouTube</p>
              <Button disabled={this.state.btnDisabled} variant="contained" color="primary" onClick={() => { this.suggestCall(); }}>
                  Sugeruj
              </Button>
          </div>
      </Paper>);
  }
}