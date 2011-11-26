
import os.path
import hashlib
import shutil

from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.shortcuts import render_to_response, get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponseRedirect, Http404, HttpResponse
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.sites.models import Site
from django.utils import simplejson

from models import BigFile, Downloader, one_week_later
from forms import UploadForm


@login_required
def listfiles(request):
    bigfiles = request.user.bigfiles.all()
    return render_to_response('bigfiles/list.html', {'bigfiles': bigfiles},
                              context_instance=RequestContext(request))


def mailit(to, from_, message, url):
    """
    compose and send an email
    """
    context = {'from': from_, 'url': url}
    body = render_to_string('email/download.html', context)
    send_mail('FileBender has a file for you!',
              body,
              'gijs@pythonic.nl',
    to, fail_silently=False)
    

def handle_uploaded_file(filename, secret, filedata):
    """
    Stores file into STORAGE. Returns MD5 of file
    """
    file_folder = os.path.join(settings.STORAGE_ROOT, secret)
    
    if not os.access(file_folder, os.F_OK):
        os.mkdir(file_folder)
        
    m = hashlib.md5()
    file_path = os.path.join(file_folder, filename)
    with open(file_path, 'wb+') as destination:
        for chunk in filedata.chunks():
            m.update(chunk)
            destination.write(chunk)
    return m.hexdigest()


@login_required
def upload(request, json=False):
    if request.method == 'GET':
        form = UploadForm()
                
    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            data = request.FILES['file']
            name = form.cleaned_data['file'].name
            size = form.cleaned_data['file'].size
            expire_date = form.cleaned_data['expire_date'] or one_week_later()
            message = form.cleaned_data['message']
            receiver = form.cleaned_data['receiver']

            bigfile = BigFile(name=name, owner=request.user,
                        expire_date=expire_date, message=message, size=size)

            md5 = handle_uploaded_file(name, bigfile.secret, data)
            bigfile.md5 = md5
            bigfile.save()

            if receiver:
                downloader = Downloader(email=receiver, bigfile=bigfile)
                downloader.save()
                url = 'http://%s/bigfiles/download/%s/%s' % \
                    (Site.objects.get_current().domain, bigfile.id, bigfile.secret)
                from_ = request.user.email
                mailit([receiver], from_, message, url)
                
            if json:
                response = {'status': 'ok', 'fileid': bigfile.id}
                return HttpResponse(simplejson.dumps(response))
            else:
                return HttpResponseRedirect('/bigfiles/list/')

    if json:
        response = {'status': 'error', 'message': 'form not valid'}
        return HttpResponse(simplejson.dumps(response))
    else:   
        return render_to_response('bigfiles/upload.html', {'form': form,},
                              context_instance=RequestContext(request))


def append(request, bigfileid):
    if request.method != 'POST':
        response = {'status': 'error', 'message': 'expected a post'}
        return HttpResponse(simplejson.dumps(response))

    form = UploadForm(request.POST, request.FILES)
    if not form.is_valid():
        response = {'status': 'error', 'message': 'no file'}
        return HttpResponse(simplejson.dumps(response))        
        
    bigfile = get_object_or_404(BigFile, pk=bigfileid)

    if request.user != bigfile.owner:
        raise Http404
     
    data = request.FILES['file']
    size = form.cleaned_data['file'].size
    filelocation = os.path.join(settings.STORAGE_ROOT, bigfile.secret, bigfile.name)
    
    if not os.access(filelocation, os.F_OK):
        raise Http404
        
    md5 = hashlib.md5()

    # recalculate md5 for existing blob
    with open(filelocation,'rb') as f: 
        for chunk in iter(lambda: f.read(8192), ''): 
            md5.update(chunk)
         
    with open(filelocation, 'ab') as f:
        for chunk in data.chunks():
            md5.update(chunk)
            f.write(chunk)

    bigfile.md5 = md5.hexdigest()
    bigfile.size = bigfile.size + size
    bigfile.save()
    
    response = {'status': 'ok', 'md5': bigfile.md5}
    return HttpResponse(simplejson.dumps(response))  
    

def download(request, bigfileid, secret):
    bigfile = get_object_or_404(BigFile, pk=bigfileid)
    if secret != bigfile.secret:
        raise Http404
    return render_to_response('bigfiles/download.html', {'bigfile': bigfile},
                              context_instance=RequestContext(request))


@login_required
def delete(request, bigfileid):
    bigfile = get_object_or_404(BigFile, pk=bigfileid)

    if request.user != bigfile.owner:
        raise Http404
    
    file_folder = os.path.join(settings.STORAGE_ROOT, bigfile.secret)
    bigfile.delete()

    try:
        shutil.rmtree(file_folder)
    except OSError:
        # file probably already gone
        pass
     
    return HttpResponseRedirect('/bigfiles/list/')

