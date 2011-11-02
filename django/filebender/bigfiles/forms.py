
from django import forms
from bigfiles.models import one_week_later

class UploadForm(forms.Form):
    file = forms.FileField('File')
    message = forms.CharField(widget=forms.Textarea(),label='Message',
                              required=False)
    receiver = forms.EmailField(label='Receiver', required=False)
    expire_date = forms.DateTimeField(label='Expire date',
                              initial=one_week_later, required=False)


