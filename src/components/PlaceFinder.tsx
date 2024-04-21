import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Grid from '@mui/material/Grid';
//import { debounce } from '@mui/material/utils';
import { searchLocation } from '../api/fetch';
import { PlaceRow } from '../api/interfaces';
import { PlaceInfo } from '../api/models';

export default function PlaceFinder({onChange, current}: {onChange: Function, current: PlaceInfo}) {
  const [value, setValue] = React.useState<PlaceRow | null>(null);
  const [options, setOptions] = React.useState<readonly PlaceRow[]>([]);


/* 
  const fetchOptions = React.useMemo(
    () =>
      debounce(
        (input) => {
          const inputText = typeof input === 'string' ? input.trim() : ''
          if (inputText.length > 1) {
            console.log(input)
            searchLocation(input).then((results:PlaceRow[]) => {
              
              if (results instanceof Array) {
                setOptions(results)
              }
            })
          }
        },
        250,
      ),
    [],
  );
 */
  const fetchOptions = (input: any = null) => {
    const inputText = typeof input === 'string' ? input.trim() : ''
    if (inputText.length > 1) {
      console.log(input)
      searchLocation(input).then((results:PlaceRow[]) => {
        if (results instanceof Array) {
          setOptions(results)
        }
      })
    }
  }
  return (
    <Autocomplete
      id="place-name-search"
      sx={{ width: '100%', maxWidth: '24em' }}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.text
      }
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText="No places found"
      onChange={(event: any, newValue: PlaceRow | null) => {
        //setOptions(newValue ? [newValue, ...options] : options);
        if (event) {
          setOptions([]);
        }
        if (newValue) {
          setValue(newValue);
          onChange(newValue);
        }
      }}
      onInputChange={(_event, newInputValue) => {
        fetchOptions(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Search another city or town" fullWidth />
      )}
      renderOption={(props, option) => {
        const itemKey = [option.lat, option.lng].join('/');
        return (
          <li {...props} key={itemKey}>
            <Grid container alignItems="center">
              <Grid item sx={{ width: 'calc(100% - 1em)', wordWrap: 'break-word' }}>
              <LocationOnIcon sx={{ color: 'text.secondary' }} />
                <Box
                    component="span"
                  >
                    {option.text}
                  </Box>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}