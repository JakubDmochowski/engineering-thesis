$directory = "./data_server"
$writer_dir = "./data"

$server_start_command = """node $directory/app.js"""
$writer_start_command = """cd $writer_dir; node ./writer.js"""

invoke-expression 'cmd /c start powershell -noexit -Command $server_start_command'
invoke-expression 'cmd /c start powershell -noexit -Command $writer_start_command'
invoke-expression 'cmd /c start powershell -noexit -Command {
	npm run serve
}'