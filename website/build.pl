#!/usr/bin/env perl
#
#  build.pl — sync the shared navbar and footer into every page.
#
#  The six HTML files stay the deployable artifacts: no build step is
#  needed to *serve* the site, and nothing changes for the browser. This
#  script exists so the nav and footer have ONE source of truth instead
#  of six copies that drift apart.
#
#  Edit:   partials/nav.html   partials/footer.html
#  Run:    perl build.pl
#  Check:  perl build.pl --check     (exits 1 if anything is out of date)
#
#  Each page marks its regions with:
#      <!-- @nav -->  ... generated ... <!-- @end -->
#      <!-- @footer --> ... generated ... <!-- @end -->
#  Anything outside those markers is never touched.
#
#  The active nav item is derived from the filename, so the partial holds
#  no per-page state.

use strict;
use warnings;

my $check_only = grep { $_ eq '--check' } @ARGV;

my @pages = qw(mainpage.html tours.html explore.html about.html contact.html login.html);

# which nav entry is "current" on each page; login has no nav entry of its own
my %active = (
    'mainpage.html' => 'mainpage.html',
    'tours.html'    => 'tours.html',
    'explore.html'  => 'explore.html',
    'about.html'    => 'about.html',
    'contact.html'  => 'contact.html',
    'login.html'    => '',
);

sub slurp {
    my ($path) = @_;
    open my $fh, '<:encoding(UTF-8)', $path or die "cannot read $path: $!\n";
    local $/;
    my $content = <$fh>;
    close $fh;
    return $content;
}

my $nav_src    = slurp('partials/nav.html');
my $footer_src = slurp('partials/footer.html');
$_ =~ s/\s+\z// for ($nav_src, $footer_src);

# Mark the current page's nav item: add .active to its <li> and
# aria-current to its <a>. Purely derived, never hand-maintained.
sub nav_for {
    my ($page) = @_;
    my $nav = $nav_src;
    my $href = $active{$page} or return $nav;

    $nav =~ s{<li(\s+class="([^"]*)")?><a href="\Q$href\E">}{
        my $cls = $2 ? "$2 active" : 'active';
        qq{<li class="$cls"><a href="$href" aria-current="page">}
    }e;

    return $nav;
}

my $stale = 0;

for my $page (@pages) {
    my $html = slurp($page);
    my $before = $html;

    my $nav = nav_for($page);

    # Each region is optional and handled independently — login.html, for
    # instance, carries a navbar but deliberately has no footer.
    unless ($html =~ /<!-- \@nav -->/ || $html =~ /<!-- \@footer -->/) {
        warn "!! $page has no \@nav or \@footer marker — skipped\n";
        next;
    }

    $html =~ s{(<!-- \@nav -->\n\s*).*?(\n\s*<!-- \@end -->)}{$1$nav$2}s
        if $html =~ /<!-- \@nav -->/;

    $html =~ s{(<!-- \@footer -->\n\s*).*?(\n\s*<!-- \@end -->)}{$1$footer_src$2}s
        if $html =~ /<!-- \@footer -->/;

    next if $html eq $before;

    $stale++;
    if ($check_only) {
        print "OUT OF DATE  $page\n";
        next;
    }

    open my $out, '>:encoding(UTF-8)', $page or die "cannot write $page: $!\n";
    print $out $html;
    close $out;
    print "updated      $page\n";
}

if ($check_only) {
    print $stale ? "\n$stale page(s) out of date — run: perl build.pl\n"
                 : "all pages in sync\n";
    exit($stale ? 1 : 0);
}

print $stale ? "\n$stale page(s) rewritten\n" : "all pages already in sync\n";
