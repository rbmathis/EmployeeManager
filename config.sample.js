config = {
	site: {
		name: 'Employee Management'
	},
	express: {
		port: 3000, // Can be overwritten in console by typing: PORT=1234 node app.js
		behind_proxy: false,
		public_dir: __dirname + '/public'
	},
	mongo: {
		uri: 'mongodb://{accountName}}:{key}}@{accountName}}.documents.azure.com:10255/{databaseName}}?ssl=true',
		options: {
			server: {
				auto_reconnect: true,
				poolSize: 10,
				socketOptions: {
					keepAlive: 1
				}
			},
			db: {
				numberOfRetries: 10,
				retryMiliSeconds: 1000
			}
		}
	},
	default_user: {
		name: 'Global Administrator',
		email: 'user@example.com',
		password: 'pass',
		timezone: (new Date().getTimezoneOffset() / -60), // this takes the default server timezone
		role: 1
	},
	sessions: {
		secret: 'Some secret', // Create your own large unguessable string 
		collection: 'site_sessions'
	},
	cookies: {
		expire: 2592000000 // 30 days.
	},
	blobs: {
		url: 'https://{storageAccountName}.blob.core.windows.net/',
		containerName: '{containerName}',
		connectionString: 'DefaultEndpointsProtocol=https;AccountName={storageAccountName}};AccountKey={storageAccountKey};EndpointSuffix=core.windows.net'
	},
	applicationInsights: {
		key: '{ApplicationInsightsKey}'
	},
	cognitive: {
		face: {
			endpoint: 'https://{cognitiveFaceRegion}.api.cognitive.microsoft.com/face/v1.0/detect',
			key: '{cognitiveFaceKey}',
			region: '{cognitiveFaceRegion}'
		}
	},
	secretvalue: { __mysecret__}
}

module.exports = config;
