# pub-sub

> Pub/Sub interface for Node.js (needs underlying [transporter](https://github.com:twittwer/pub-sub#pubsubtransporter---pubsub-transporter-interface), like [pub-sub-transporter-redis](https://github.com:twittwer/pub-sub-transporter-redis))

## Installation

`npm install git+ssh://git@github.com:twittwer/pub-sub.git`

## Usage

```javascript
const pubSub = require( 'pub-sub' ),
    pubSubTransporterRedis = require( 'pub-sub-transporter-redis' ),
    redis = require( 'redis' );

/* Transporter Initialization */
const redisClientFactory = () => {
    return redis.createClient( {
        host: process.env.REDIS_HOST
    } );
}

const redisTransporter = pubSubTransporterRedis.initialize( {
    redisClientFactory: redisClientFactory
} );

/* Pub/Sub Initialization */
pubSub.initialize( {
    transporter: redisTransporter,
    channelPrefix: 'pubSub:'
} );

/* Publications */
pubSub.publish( 'news', { title: 'AI will be merciful!' } );

/* Subscriptions */
const unsubscribe = pubSub.subscribe( 'news', ( channel, data ) => {
    console.log( 'BREAKING NEWS: ' + data.title );
} );
//...
unsubscribe();
```

## Reference

> required **parameters** are written bold  
> optional *parameters* are written italic or marked with `[`square brackets`]`  

### Methods

#### pubSub.initialize(config): void

Initializes Pub/Sub Module  
Connects to event transporter and configures pub/sub module.

| Param  | Type           | Description          |
| ------ | -------------- | -------------------- |
| config | `moduleConfig` | module configuration |

#### pubSub.publish(channel, data): void

Publishes Data to Channel

| Param   | Type     | Description                          |
| ------- | -------- | ------------------------------------ |
| channel | `string` | name of targeted channel             |
| data    | `object` | object (JSON) to publish via channel |

#### pubSub.subscribe(channel, subscriptionHandler): function

Registers Subscription Handler for Channel  
Adds subscription handler to registry and   
subscribes transporter to channel, if it wasn't done before.

**Returns**: `function` to terminate the currently created subscription (see _unsubscribe)

| Param               | Type          | Description                                     |
| ------------------- | ------------- | ----------------------------------------------- |
| channel             | `string`      | name of channel, the handler should be bound to |
| subscriptionHandler | `dataHandler` | handler function for channel's incoming data    |

### Custom Type Definitions

#### `moduleConfig` - Module Configuration

| Param               | Type                | Description                                                                                                  |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| **transporter**     | `pubSubTransporter` | accessor object for pub/sub's underlying event transporter                                                   |
| *channelPrefix*     | `string|object`     | shortcut to set channelPrefix.pub and channelPrefix.sub at once                                              |
| *channelPrefix.pub* | `string`            | prefix to prepend the name of any channel, data is published to*                                             |
| *channelPrefix.pub* | `string`            | prefix to prepend the name of any subscribed channel; prefix is cut before subscription handler are called** |

> *) e.g. 'pubSub:' causes 'news'->'pubSub:news'
> **) e.g. 'pubSub:' causes 'pubSub:news'->'news'

#### `pubSubTransporter` - Pub/Sub Transporter Interface

##### pubSubTransporter.connect(dataHandler): void

Boots up Transporter  
Establishes internally needed connections,  
sets event listeners and  
performs any other tasks initially needed by transporter.

| Param       | Type          | Description                                        |
| ----------- | ------------- | -------------------------------------------------- |
| dataHandler | `dataHandler` | function to handle incoming events of transporter* |

> *) is used to expose events from transporter module to pub/sub module

##### pubSubTransporter.publish(channel, data): void

Publishes Data to Channel  
Does optionally preprocessing of data and emits it to specified channel.

| Param   | Type     | Description                          |
| ------- | -------- | ------------------------------------ |
| channel | `string` | name of targeted channel             |
| data    | `object` | object (JSON) to publish via channel |

##### pubSubTransporter.subscribe(channel): void

Subscribes Transporter to Channel

| Param   | Type     | Description                                                       |
| ------- | -------- | ----------------------------------------------------------------- |
| channel | `string` | name of channel, whose events should be passed on to data handler |

##### pubSubTransporter.unsubscribe(channel): void

Unsubscribes Transporter from Channel

| Param   | Type     | Description                                                               |
| ------- | -------- | ------------------------------------------------------------------------- |
| channel | `string` | name of channel, whose events shouldn't be passed to data handler anymore |

#### `dataHandler` - Data Handler Function

Processes Incoming Events  
Handles events of subscribed channels.

| Param   | Type     | Description            |
| ------- | -------- | ---------------------- |
| channel | `string` | name of source channel |
| data    | `object` | received data object   |
