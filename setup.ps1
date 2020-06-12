$directory = "./data_server"

$server_start_command = """node $directory/app.js"""

invoke-expression 'cmd /c start powershell -noexit -Command $server_start_command'
invoke-expression 'cmd /c start powershell -noexit -Command {
	npm run serve
}'