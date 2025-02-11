class Utils:
    def __init__(self,allowed_extensions):
        self.allowed_extensions = allowed_extensions


    def allowed_file(self,filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in self.allowed_extensions
    