1. Get rewards info from readsi script, write to file `rewards.json`:
    ```bash
    go run main.go --since=1125h --cmd=reward --format=json > rewards.json
    ```
    Remove results not from target month

1. Get total network dump, save as `dump-total`
    ```
    https://api.swarmscan.io/v1/network/dump
    ```
    * This contains 

1. Get commit events dump, save as `commits-month-year`:
    
    ```
    https://api.swarmscan.io/v1/events/redistribution/committed/dump
    ```
