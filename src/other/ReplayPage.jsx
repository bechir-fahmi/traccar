import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  Badge,
  Box,
  Chip,
  Divider,
  IconButton, List, ListItem, Paper, Slider, Stack, Toolbar, Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView, { map } from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import { formatSpeed, formatTime } from '../common/util/formatter';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import findTourParkings, { findTourHistory, findTourReturns } from '../map/util/findTourParkings';
import { mockTour } from '../map/util/mockTour';
import MapRouteParkings from '../map/MapRouteParkings';
import { convertLatitudeToPixel, convertLongitudeToPixel } from '../map/util/utilities';
import ReactSpeedometer from "react-d3-speedometer"

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formControlLabel: {
    height: '100%',
    width: '100%',
    paddingRight: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1),
    },
  },
  speedometer: {
    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(7),
    zIndex: 4,
    background: 'white',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
  },
}));

const ReplayPage = () => {
  const t = useTranslation();
  const classes = useStyles();
  const navigate = useNavigate();
  const timerRef = useRef();

  const hours12 = usePreference('twelveHourFormat');

  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const [from, setFrom] = useState();
  const [to, setTo] = useState();
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((index) => index + 1);
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, positions]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const onPointClick = useCallback((_, index) => {
    setIndex(index);
  }, [setIndex]);

  const onMarkerClick = useCallback((positionId) => {
    setShowCard(!!positionId);
  }, [setShowCard]);

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    setSelectedDeviceId(deviceId);
    setFrom(from);
    setTo(to);
    const query = new URLSearchParams({ deviceId, from, to });
    const response = await fetch(`/api/positions?${query.toString()}`);
    if (response.ok) {
      setIndex(0);
      const positions = await response.json();
      setPositions(positions);
      if (positions.length) {
        setExpanded(false);
      } else {
        throw Error(t('sharedNoData'));
      }
    } else {
      throw Error(await response.text());
    }
  });
  const speedUnit = useAttributePreference("speedUnit")

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };
  let parkings = [];
  let returns = []
   if(positions.length>0){
    parkings = findTourParkings(positions)
    returns = findTourReturns(positions);
   }
  const tourHistoryItems = findTourHistory(parkings,returns)
  const latitudeRange = { min: 30.2, max: 37.3 };
  const longitudeRange = { min: 7.5, max: 11.5 };
  return (
    <div className={classes.root}>
      <MapView>
        <MapGeofence />
        <MapRoutePath positions={positions} />
         <MapRoutePoints positions={positions} onClick={onPointClick} />
        {index < positions.length && (
          <MapPositions positions={[positions[index]]} onClick={onMarkerClick} titleField="fixTime" />
        )}
        {parkings.length>0? <MapRouteParkings parkings={parkings} />:null}
       
      </MapView>
      <MapCamera positions={positions} />
      <div className={classes.sidebar}>
        <Paper elevation={3} square>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>{t('reportReplay')}</Typography>
            {!expanded && (
              <>
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => setExpanded(true)}>
                  <TuneIcon />
                </IconButton>
              </>
            )}
          </Toolbar>
        </Paper>
        <Paper className={classes.content} square>
          {!expanded ? (
            <>
              <Typography variant="subtitle1" align="center">{deviceName}</Typography>
              <Slider
                className={classes.slider}
                max={positions.length - 1}
                step={null}
                marks={positions.map((_, index) => ({ value: index }))}
                value={index}
                onChange={(_, index) => setIndex(index)}
              />
              <div className={classes.controls}>
                {`${index + 1}/${positions.length}`}
                <IconButton onClick={() => setIndex((index) => index - 1)} disabled={playing || index <= 0}>
                  <FastRewindIcon />
                </IconButton>
                <IconButton onClick={() => setPlaying(!playing)} disabled={index >= positions.length - 1}>
                  {playing ? <PauseIcon /> : <PlayArrowIcon /> }
                </IconButton>
                <IconButton onClick={() => setIndex((index) => index + 1)} disabled={playing || index >= positions.length - 1}>
                  <FastForwardIcon />
                </IconButton>
                {formatTime(positions[index].fixTime, 'seconds', hours12)}
                 </div>
            </>
          ) : (
            <ReportFilter handleSubmit={handleSubmit} fullScreen showOnly />
          )}
        </Paper>
        <Paper elevation={3} square>
        <Toolbar>
            <Typography variant="h6" className={classes.title}>History</Typography>
            
          </Toolbar>
          <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'auto',
        maxHeight: 500,
        '& ul': { padding: 0 },
      }}
    >
      
      {tourHistoryItems.map((i,index) => (
            
              <ListItem key={`item-${i}-${index}`}>
                <HistoryItem speed={i.speed} duration={i.type.toUpperCase()==="PARKING"?i.duration:0} type={i.type.toUpperCase()} date={i.deviceTime} position={i} />
                <Divider  variant="inset" component="li" />
              </ListItem>
            
      ))}
    </List>
 
              

        </Paper>
      </div>
      {showCard && index < positions.length && (
        <div style={{position:"absolute",top:` ${map.project([positions[index].longitude, positions[index].latitude]).y+200}px`,left:`${map.project([positions[index].longitude, positions[index].latitude]).x+200}px`}}>

<StatusCard
        
        deviceId={selectedDeviceId}
         position={positions[index]}
         onClose={() => setShowCard(false)}
         disableActions
       />
        </div>
        )}
      <div className={classes.speedometer}>
        {positions.length > 0 && (
          <ReactSpeedometer
            value={parseFloat(formatSpeed(positions[index].speed, speedUnit, t).split(" ")[0])}
            needleTransition="easeLinear"
            height={200}
            segmentColors={["#3dff4d", '#88fc4e', "#fcee4e", "#fc914e", "#fc4e4e"]}
            segments={5}
            minValue={0}
            maxValue={280}
            currentValueText={`${formatSpeed(positions[index].speed, speedUnit, t)}`}
          />
        )}
      </div>
    </div>
  );
};

export default ReplayPage;

const HistoryItem = ({ type, date, position, speed, duration }) => {
  const t = useTranslation();
  const speedUnit = useAttributePreference("speedUnit")

  return (
    <>
      <Box padding={2} style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", flexDirection: "column" }}>
        {type === "PARKING" ? <Typography>Parking</Typography> : <Typography>Revien</Typography>}
        <Stack width={"100%"} spacing={2} direction={"row"} justifyContent={"space-between"}>
          <Chip style={{ marginTop: "10px" }} color='success' label={date}></Chip>
          <Chip style={{ marginTop: "10px" }} color='default' label={"Vitesse: " + formatSpeed(speed, speedUnit, t).toString().concat(" Km/h")}></Chip>
        </Stack>
        {type === "PARKING" ? <Stack direction={"row"} justifyContent={"space-between"}>
          <Chip style={{ marginTop: "10px" }} color='secondary' label={"Durée: " + duration.toString().slice(0, 5).concat(" min")}></Chip>
        </Stack> : null}
      </Box>
      <Divider />
    </>
  )
}
